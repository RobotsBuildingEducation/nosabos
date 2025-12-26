// src/hooks/useNostrWalletStore.js
// NIP-60 (Cashu Wallets) and NIP-61 (Nutzaps) implementation
// Zustand store for global wallet state
import { create } from "zustand";
import NDK, {
  NDKPrivateKeySigner,
  NDKNip07Signer,
  NDKUser,
  NDKZapper,
} from "@nostr-dev-kit/ndk";
import { NDKWalletService, NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { Buffer } from "buffer";
import { bech32 } from "bech32";

/**
 * Check if we're in NIP-07 mode (using browser extension)
 */
function isNip07Mode() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem("nip07_signer") === "true"
  );
}

/**
 * Check if NIP-07 extension is available
 */
function isNip07Available() {
  return typeof window !== "undefined" && window.nostr;
}

// Default configuration
const DEFAULT_MINT = "https://mint.minibits.cash/Bitcoin";
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
];

// Hardcoded recipient for zaps
const RECIPIENT_NIP05 = "sheilfer@primal.net";

// localStorage key for tracked balance
const TRACKED_BALANCE_KEY = "wallet_tracked_balance";

/**
 * Load tracked balance from localStorage
 */
function loadTrackedBalance() {
  try {
    const stored = localStorage.getItem(TRACKED_BALANCE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  } catch (e) {
    console.warn("[Wallet] Error loading tracked balance:", e);
  }
  return null; // null means not yet initialized
}

/**
 * Save tracked balance to localStorage
 */
function saveTrackedBalance(balance) {
  try {
    localStorage.setItem(TRACKED_BALANCE_KEY, String(balance));
  } catch (e) {
    console.warn("[Wallet] Error saving tracked balance:", e);
  }
}

/**
 * Safely extract total balance from wallet.balance() response
 * The response can be: number, { amount }, or [{ amount, unit }]
 */
function extractBalance(bal) {
  if (bal === null || bal === undefined) return 0;

  // If it's a simple number
  if (typeof bal === "number") return bal;

  // If it's an array of balance entries
  if (Array.isArray(bal)) {
    return bal.reduce((sum, entry) => {
      if (typeof entry === "number") return sum + entry;
      if (entry && typeof entry.amount === "number") return sum + entry.amount;
      return sum;
    }, 0);
  }

  // If it's an object with amount
  if (typeof bal === "object" && typeof bal.amount === "number") {
    return bal.amount;
  }

  // Try to parse as number
  const parsed = Number(bal);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Decode bech32 key (npub/nsec) to hex
 */
function decodeKey(key) {
  try {
    const { words } = bech32.decode(key);
    return Buffer.from(bech32.fromWords(words)).toString("hex");
  } catch (e) {
    console.error("Error decoding key:", e);
    return null;
  }
}

/**
 * Encode hex to bech32 (npub/nsec)
 */
function encodeKey(hex, prefix) {
  try {
    const words = bech32.toWords(Buffer.from(hex, "hex"));
    return bech32.encode(prefix, words);
  } catch (e) {
    console.error("Error encoding key:", e);
    return null;
  }
}

export const useNostrWalletStore = create((set, get) => ({
  // State
  isConnected: false,
  errorMessage: null,
  nostrPubKey: "",
  nostrPrivKey: "",
  ndkInstance: null,
  signer: null,
  walletService: null,
  cashuWallet: null,
  walletBalance: 0,
  invoice: "",
  isCreatingWallet: false,
  isWalletReady: false,

  // Internal refs (not reactive)
  _balanceUpdateTimeout: null,

  // Setters
  setError: (msg) => set({ errorMessage: msg }),
  setInvoice: (data) => set({ invoice: data }),

  // Utility: Get hex pubkey from npub
  getHexNPub: (npub) => decodeKey(npub),

  // Refresh balance with debouncing
  refreshBalance: async () => {
    const { cashuWallet, _balanceUpdateTimeout } = get();
    if (!cashuWallet) return 0;

    // Clear any pending balance update
    if (_balanceUpdateTimeout) {
      clearTimeout(_balanceUpdateTimeout);
    }

    try {
      // Small delay to let wallet state settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      const bal = await cashuWallet.balance();
      const totalBalance = extractBalance(bal);

      console.log("[Wallet] Balance refreshed:", totalBalance);
      set({ walletBalance: totalBalance });
      return totalBalance;
    } catch (e) {
      console.error("[Wallet] Error refreshing balance:", e);
      return get().walletBalance;
    }
  },

  // Setup wallet listeners
  setupWalletListeners: async (wallet) => {
    if (!wallet || !(wallet instanceof NDKCashuWallet)) return;

    console.log("[Wallet] Setting up wallet listeners");

    // We no longer listen to balance_updated events from the wallet
    // because they're unreliable. Instead, we track balance ourselves.

    set({
      cashuWallet: wallet,
      isWalletReady: false,
    });

    // Initialize tracked balance: use localStorage if available,
    // otherwise sync from wallet.balance() on first load
    setTimeout(async () => {
      const storedBalance = loadTrackedBalance();
      if (storedBalance !== null) {
        // Use our tracked balance for immediate stability
        console.log(
          "[Wallet] Using tracked balance from localStorage:",
          storedBalance
        );
        set({ walletBalance: storedBalance, isWalletReady: true });

        // Run background sync after initial load to catch any relay updates
        // This handles cases where funds were received while offline
        setTimeout(async () => {
          try {
            console.log("[Wallet] Starting background sync with relay...");
            const bal = await wallet.balance();
            const relayBalance = extractBalance(bal);

            if (relayBalance !== storedBalance) {
              console.log(
                "[Wallet] Background sync found different balance:",
                storedBalance,
                "->",
                relayBalance
              );
              saveTrackedBalance(relayBalance);
              set({ walletBalance: relayBalance });
            } else {
              console.log(
                "[Wallet] Background sync complete - balance unchanged:",
                relayBalance
              );
            }
          } catch (e) {
            console.warn("[Wallet] Background sync failed (non-critical):", e);
            // Keep using localStorage balance on sync failure
          }
        }, 3000); // Wait 3 seconds after initial load before syncing
      } else {
        // First time: sync from wallet
        try {
          const bal = await wallet.balance();
          const initialBalance = extractBalance(bal);
          console.log("[Wallet] Initial balance from wallet:", initialBalance);
          saveTrackedBalance(initialBalance);
          set({ walletBalance: initialBalance, isWalletReady: true });
        } catch (e) {
          console.error("[Wallet] Error getting initial balance:", e);
          set({ walletBalance: 0, isWalletReady: true });
        }
      }
    }, 1500);
  },

  // Initialize wallet service
  initWalletService: async (providedNdk, providedSigner) => {
    const {
      setError,
      ndkInstance,
      signer,
      nostrPubKey,
      nostrPrivKey,
      connectToNostr,
      setupWalletListeners,
    } = get();

    try {
      let ndk = providedNdk || ndkInstance;
      let s = providedSigner || signer;

      if (!ndk || !s) {
        // Handle both NIP-07 mode (only pubKey) and private key mode (both keys)
        const canConnectNip07 =
          isNip07Mode() && isNip07Available() && nostrPubKey;
        const canConnectPrivKey = nostrPubKey && nostrPrivKey;

        if (canConnectNip07 || canConnectPrivKey) {
          const connection = await connectToNostr(nostrPubKey, nostrPrivKey);
          if (connection) {
            ndk = connection.ndkInstance;
            s = connection.signer;
            set({ ndkInstance: ndk, signer: s });
          } else {
            throw new Error("Unable to connect to Nostr.");
          }
        } else {
          throw new Error("NDK or signer not found and no keys to reconnect.");
        }
      }

      ndk.signer = s;
      const user = await s.user();
      user.signer = s;

      const wService = new NDKWalletService(ndk);
      wService.start();

      // Listen for default wallet
      wService.on("wallet:default", (wallet) => {
        console.log("[Wallet] Default wallet detected:", wallet?.walletId);
        setupWalletListeners(wallet);
      });

      // Also listen for wallet ready
      wService.on("wallet:ready", (wallet) => {
        console.log("[Wallet] Wallet ready event");
        const { cashuWallet } = get();
        if (wallet && !cashuWallet) {
          setupWalletListeners(wallet);
        }
      });

      set({ walletService: wService });
      return true;
    } catch (error) {
      console.error("[Wallet] Error initializing wallet service:", error);
      setError(error.message);
      return false;
    }
  },

  // Connect to Nostr relays
  connectToNostr: async (npubRef = null, nsecRef = null) => {
    const { setError, nostrPrivKey, nostrPubKey } = get();

    const storedNsec = localStorage.getItem("local_nsec");
    const nsec = nsecRef || (storedNsec !== "nip07" ? nostrPrivKey : null);
    const npub = npubRef || nostrPubKey;

    try {
      const ndkInstance = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
      });

      await ndkInstance.connect();

      // Handle NIP-07 mode - use extension signer
      if (isNip07Mode() && isNip07Available()) {
        console.log("[Wallet] Using NIP-07 signer");
        const signer = new NDKNip07Signer();
        await signer.blockUntilReady();
        const user = await signer.user();
        const hexNpub = user.pubkey;

        set({ isConnected: true });
        return { ndkInstance, hexNpub, signer };
      }

      // Handle private key mode
      if (!nsec || !nsec.startsWith("nsec")) {
        console.error("[Wallet] No valid nsec provided and not in NIP-07 mode");
        return null;
      }

      const hexNsec = decodeKey(nsec);
      if (!hexNsec) throw new Error("Invalid nsec key");

      const signer = new NDKPrivateKeySigner(hexNsec);
      const user = await signer.user();
      const hexNpub = user.pubkey;

      set({ isConnected: true });

      return { ndkInstance, hexNpub, signer };
    } catch (err) {
      console.error("[Wallet] Error connecting to Nostr:", err);
      setError(err.message);
      return null;
    }
  },

  // Initialize wallet (called on app load)
  init: async () => {
    const storedNpub = localStorage.getItem("local_npub");
    const storedNsec = localStorage.getItem("local_nsec");
    const isNip07 = isNip07Mode();

    if (storedNpub) set({ nostrPubKey: storedNpub });
    if (storedNsec && storedNsec !== "nip07") set({ nostrPrivKey: storedNsec });

    const { connectToNostr } = get();

    // Handle NIP-07 mode
    if (isNip07 && storedNpub && isNip07Available()) {
      console.log("[Wallet] Initializing with NIP-07 signer");
      const connection = await connectToNostr(storedNpub, null);
      if (connection) {
        const { ndkInstance: ndk, signer: s } = connection;
        set({ ndkInstance: ndk, signer: s });
        return true;
      }
    }

    // Handle private key mode
    if (storedNpub && storedNsec && storedNsec !== "nip07") {
      console.log("[Wallet] Initializing with stored keys");
      const connection = await connectToNostr(storedNpub, storedNsec);
      if (connection) {
        const { ndkInstance: ndk, signer: s } = connection;
        set({ ndkInstance: ndk, signer: s });
        return true;
      }
    }
    return false;
  },

  // Create new wallet
  createNewWallet: async () => {
    const {
      ndkInstance,
      signer,
      setError,
      initWalletService,
      setupWalletListeners,
      init,
    } = get();

    set({ isCreatingWallet: true });

    try {
      let ndk = ndkInstance;
      let s = signer;

      if (!ndk || !s) {
        await init();
        await initWalletService();
        ndk = get().ndkInstance;
        s = get().signer;

        if (!ndk || !s) {
          throw new Error("Failed to initialize NDK");
        }
      }

      // Ensure ndk has the signer set
      ndk.signer = s;

      const newWallet = new NDKCashuWallet(ndk);
      newWallet.relays = DEFAULT_RELAYS;
      newWallet.setPublicTag("relay", "wss://relay.damus.io");
      newWallet.setPublicTag("relay", "wss://relay.primal.net");
      newWallet.walletId = "Robots Building Education Wallet";
      newWallet.mints = [DEFAULT_MINT];
      newWallet.unit = "sat";
      newWallet.setPublicTag("unit", "sat");
      newWallet.setPublicTag("d", "Robots Building Education Wallet");

      // Only set privkey if available (not available with NIP-07)
      const pk = s.privateKey;
      if (pk) {
        newWallet.privkey = pk;
      }

      await newWallet.publish();
      console.log("[Wallet] New wallet created and published");

      await setupWalletListeners(newWallet);

      set({ isCreatingWallet: false });
      return newWallet;
    } catch (error) {
      console.error("[Wallet] Error creating new wallet:", error);
      setError(error.message);
      set({ isCreatingWallet: false });
      return null;
    }
  },

  // Send 1 sat zap to hardcoded recipient (sheilfer@primal.net)
  sendOneSatZap: async (comment = "Robots Building Education") => {
    const { ndkInstance, cashuWallet, setError, walletBalance } = get();

    if (!ndkInstance) {
      console.error("[Wallet] NDK instance not ready");
      setError("NDK not initialized");
      return false;
    }

    if (!cashuWallet) {
      console.error("[Wallet] Wallet not initialized");
      setError("Wallet not initialized");
      return false;
    }

    // Check balance first
    const currentBalance = extractBalance(walletBalance);
    if (currentBalance < 1) {
      console.error("[Wallet] Insufficient balance:", currentBalance);
      setError("Insufficient balance");
      return false;
    }

    try {
      console.log("[Wallet] Resolving user from NIP-05:", RECIPIENT_NIP05);

      // Resolve the recipient from NIP-05 address
      const user = await NDKUser.fromNip05(RECIPIENT_NIP05, ndkInstance);

      if (!user) {
        throw new Error(`Could not resolve NIP-05: ${RECIPIENT_NIP05}`);
      }

      console.log("[Wallet] User resolved:", user.pubkey);

      // Set the wallet on NDK so NDKZapper can use it
      ndkInstance.wallet = cashuWallet;

      // Create zapper and send zap
      const zapper = new NDKZapper(user, 1, "sat", { comment });
      console.log("[Wallet] Sending 1 sat zap...");

      const results = await zapper.zap();
      console.log("[Wallet] Zap results:", results);

      // Update our tracked balance (decrement by amount spent)
      const newBalance = Math.max(0, currentBalance - 1);
      saveTrackedBalance(newBalance);
      set({ walletBalance: newBalance });
      console.log(
        "[Wallet] Tracked balance updated:",
        currentBalance,
        "->",
        newBalance
      );

      return true;
    } catch (e) {
      console.error("[Wallet] Error sending zap:", e);
      setError(e.message);
      return false;
    }
  },

  // Initiate deposit (create Lightning invoice)
  initiateDeposit: async (amountInSats = 10) => {
    const { cashuWallet, setError, setInvoice } = get();

    if (!cashuWallet) {
      console.error("[Wallet] Wallet not initialized");
      setError("Wallet not initialized");
      return null;
    }

    try {
      const deposit = cashuWallet.deposit(amountInSats, DEFAULT_MINT, "sat");
      const pr = await deposit.start();

      console.log("[Wallet] Invoice created:", pr?.substring(0, 50) + "...");
      setInvoice(pr);

      // Listen for success
      deposit.on("success", async (token) => {
        console.log("[Wallet] Deposit successful!");

        // Update our tracked balance (increment by deposit amount)
        // Use get() to get current balance at time of success, not at time of deposit start
        const currentBalance = extractBalance(get().walletBalance);
        const newBalance = currentBalance + amountInSats;
        saveTrackedBalance(newBalance);
        set({
          walletBalance: newBalance,
          invoice: "",
        });
        console.log(
          "[Wallet] Tracked balance updated:",
          currentBalance,
          "->",
          newBalance
        );
      });

      deposit.on("error", (e) => {
        console.error("[Wallet] Deposit error:", e);
        setError(e.message || "Deposit failed");
        setInvoice("");
      });

      return pr;
    } catch (e) {
      console.error("[Wallet] Error initiating deposit:", e);
      setError(e.message);
      return null;
    }
  },

  // Force sync balance from wallet (use if tracked balance drifts)
  syncBalanceFromWallet: async () => {
    const { cashuWallet } = get();
    if (!cashuWallet) {
      console.warn("[Wallet] Cannot sync - wallet not initialized");
      return;
    }

    try {
      const bal = await cashuWallet.balance();
      const syncedBalance = extractBalance(bal);
      saveTrackedBalance(syncedBalance);
      set({ walletBalance: syncedBalance });
      console.log("[Wallet] Balance synced from wallet:", syncedBalance);
      return syncedBalance;
    } catch (e) {
      console.error("[Wallet] Error syncing balance:", e);
    }
  },

  // Reset state (logout)
  resetState: () => {
    const { _balanceUpdateTimeout } = get();
    if (_balanceUpdateTimeout) {
      clearTimeout(_balanceUpdateTimeout);
    }

    // Clear tracked balance from localStorage
    try {
      localStorage.removeItem(TRACKED_BALANCE_KEY);
    } catch (e) {
      console.warn("[Wallet] Error clearing tracked balance:", e);
    }

    set({
      isConnected: false,
      errorMessage: null,
      nostrPubKey: "",
      nostrPrivKey: "",
      ndkInstance: null,
      signer: null,
      walletService: null,
      cashuWallet: null,
      walletBalance: 0,
      invoice: "",
      isCreatingWallet: false,
      isWalletReady: false,
      _balanceUpdateTimeout: null,
    });
  },
}));

export default useNostrWalletStore;
