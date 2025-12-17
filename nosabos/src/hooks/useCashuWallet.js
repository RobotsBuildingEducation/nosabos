// src/hooks/useCashuWallet.js
// NIP-60 (Cashu Wallets) and NIP-61 (Nutzaps) implementation
// Uses @nostr-dev-kit/ndk-wallet for Cashu operations
import { useState, useCallback, useEffect, useRef } from "react";
import NDK, { NDKPrivateKeySigner, NDKEvent } from "@nostr-dev-kit/ndk";
import NDKWalletService, { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { Buffer } from "buffer";
import { bech32 } from "bech32";

// Default configuration
const DEFAULT_MINT = "https://mint.minibits.cash/Bitcoin";
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
];

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
 * Custom hook for NIP-60/NIP-61 Cashu wallet operations
 * All wallet state and operations are contained in this single hook
 */
export function useCashuWallet() {
  // Core state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // User identity
  const [npub, setNpub] = useState("");
  const [nsec, setNsec] = useState("");
  const [hexPubkey, setHexPubkey] = useState("");
  const [hexPrivkey, setHexPrivkey] = useState("");
  
  // Wallet state
  const [balance, setBalance] = useState(0);
  const [invoice, setInvoice] = useState("");
  const [walletEventId, setWalletEventId] = useState(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [isWalletReady, setIsWalletReady] = useState(false);
  
  // NDK instances
  const ndkRef = useRef(null);
  const signerRef = useRef(null);
  const walletServiceRef = useRef(null);
  const cashuWalletRef = useRef(null);
  const isInitializedRef = useRef(false);
  const balanceUpdateTimeoutRef = useRef(null);

  // Utility: Convert npub/nsec to hex
  const decodeKey = useCallback((key) => {
    try {
      const { words } = bech32.decode(key);
      return Buffer.from(bech32.fromWords(words)).toString("hex");
    } catch (e) {
      console.error("Error decoding key:", e);
      return null;
    }
  }, []);

  // Utility: Encode hex to npub/nsec
  const encodeKey = useCallback((hex, prefix) => {
    try {
      const words = bech32.toWords(Buffer.from(hex, "hex"));
      return bech32.encode(prefix, words);
    } catch (e) {
      console.error("Error encoding key:", e);
      return null;
    }
  }, []);

  // Fetch and update balance with debouncing to prevent race conditions
  const refreshBalance = useCallback(async () => {
    const wallet = cashuWalletRef.current;
    if (!wallet) return 0;
    
    // Clear any pending balance update
    if (balanceUpdateTimeoutRef.current) {
      clearTimeout(balanceUpdateTimeoutRef.current);
    }
    
    try {
      // Small delay to let wallet state settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const bal = await wallet.balance();
      const totalBalance = extractBalance(bal);
      
      console.log("[useCashuWallet] Balance refreshed:", totalBalance, "raw:", bal);
      setBalance(totalBalance);
      return totalBalance;
    } catch (e) {
      console.error("[useCashuWallet] Error refreshing balance:", e);
      return balance;
    }
  }, [balance]);

  // Setup wallet listeners
  const setupWalletListeners = useCallback(async (wallet) => {
    if (!wallet || !(wallet instanceof NDKCashuWallet)) return;
    
    console.log("[useCashuWallet] Setting up wallet listeners");
    cashuWalletRef.current = wallet;
    setHasWallet(true);
    
    // Listen for balance updates with debouncing
    wallet.on("balance_updated", async () => {
      console.log("[useCashuWallet] Balance update event received");
      
      // Debounce balance updates
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current);
      }
      
      balanceUpdateTimeoutRef.current = setTimeout(async () => {
        await refreshBalance();
      }, 300);
    });
    
    // Get initial balance after a short delay to let proofs load
    setTimeout(async () => {
      await refreshBalance();
      setIsWalletReady(true);
    }, 1500);
  }, [refreshBalance]);

  // Initialize wallet service
  const initWalletService = useCallback(async (ndk, signer) => {
    if (!ndk || !signer) return false;
    
    try {
      ndk.signer = signer;
      const user = await signer.user();
      user.signer = signer;
      
      const wService = new NDKWalletService(ndk);
      walletServiceRef.current = wService;
      
      // Start wallet service
      wService.start();
      
      // Listen for default wallet
      wService.on("wallet:default", (wallet) => {
        console.log("[useCashuWallet] Default wallet detected:", wallet?.walletId);
        setWalletEventId(wallet?.walletId || "default");
        setupWalletListeners(wallet);
      });
      
      // Also listen for any wallet ready event
      wService.on("wallet:ready", (wallet) => {
        console.log("[useCashuWallet] Wallet ready event");
        if (wallet && !cashuWalletRef.current) {
          setupWalletListeners(wallet);
        }
      });
      
      return true;
    } catch (e) {
      console.error("[useCashuWallet] Wallet service init error:", e);
      return false;
    }
  }, [setupWalletListeners]);

  // Connect to Nostr relays
  const connect = useCallback(async (userNpub, userNsec) => {
    setIsLoading(true);
    setError(null);
    setIsWalletReady(false);
    
    try {
      const hexPriv = decodeKey(userNsec);
      if (!hexPriv) {
        throw new Error("Invalid nsec key");
      }
      
      // Initialize NDK
      const ndk = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
      });
      
      await ndk.connect();
      
      const signer = new NDKPrivateKeySigner(hexPriv);
      ndk.signer = signer;
      
      // Get user (pubkey) from signer
      const user = await signer.user();
      const hexPub = user.pubkey;
      const derivedNpub = encodeKey(hexPub, "npub");
      
      ndkRef.current = ndk;
      signerRef.current = signer;
      
      // Store keys
      setNpub(derivedNpub);
      setNsec(userNsec);
      setHexPubkey(hexPub);
      setHexPrivkey(hexPriv);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem("cashu_npub", derivedNpub);
      localStorage.setItem("cashu_nsec", userNsec);
      
      // Initialize wallet service
      await initWalletService(ndk, signer);
      
      return true;
    } catch (e) {
      console.error("Connection error:", e);
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [decodeKey, encodeKey, initWalletService]);

  // Create new user with username
  const createUser = useCallback(async (username) => {
    setIsLoading(true);
    setError(null);
    setIsWalletReady(false);
    
    try {
      // Generate new keypair
      const privkeyBytes = crypto.getRandomValues(new Uint8Array(32));
      const hexPriv = Buffer.from(privkeyBytes).toString("hex");
      const newNsec = encodeKey(hexPriv, "nsec");
      
      // Create signer to get pubkey
      const signer = new NDKPrivateKeySigner(hexPriv);
      const user = await signer.user();
      const hexPub = user.pubkey;
      const newNpub = encodeKey(hexPub, "npub");
      
      // Initialize NDK
      const ndk = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
      });
      
      await ndk.connect();
      ndk.signer = signer;
      
      ndkRef.current = ndk;
      signerRef.current = signer;
      
      // Publish kind:0 profile metadata
      const profileEvent = new NDKEvent(ndk, {
        kind: 0,
        content: JSON.stringify({
          name: username,
          about: `Created with Nutsack wallet experiment`,
        }),
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
      });
      
      await profileEvent.sign(signer);
      await profileEvent.publish();
      
      // Store keys
      setNpub(newNpub);
      setNsec(newNsec);
      setHexPubkey(hexPub);
      setHexPrivkey(hexPriv);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem("cashu_npub", newNpub);
      localStorage.setItem("cashu_nsec", newNsec);
      
      // Initialize wallet service
      await initWalletService(ndk, signer);
      
      return { npub: newNpub, nsec: newNsec };
    } catch (e) {
      console.error("Create user error:", e);
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [encodeKey, initWalletService]);

  // Create NIP-60 wallet
  const createWallet = useCallback(async () => {
    if (!ndkRef.current || !signerRef.current) {
      setError("Not connected");
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ndk = ndkRef.current;
      const signer = signerRef.current;
      
      // Create new NDKCashuWallet
      const newWallet = new NDKCashuWallet(ndk);
      newWallet.relays = DEFAULT_RELAYS;
      newWallet.setPublicTag("relay", "wss://relay.damus.io");
      newWallet.setPublicTag("relay", "wss://relay.primal.net");
      
      // Set wallet ID
      newWallet.walletId = "Nutsack Experiment Wallet";
      
      // Set mint
      newWallet.mints = [DEFAULT_MINT];
      
      // Set unit
      newWallet.unit = "sat";
      newWallet.setPublicTag("unit", "sat");
      newWallet.setPublicTag("d", "Nutsack Experiment Wallet");
      
      // Set privkey for P2PK
      const pk = signer.privateKey;
      if (pk) {
        newWallet.privkey = pk;
      }
      
      // Publish wallet event
      await newWallet.publish();
      
      console.log("[useCashuWallet] Wallet created and published");
      
      // Setup listeners for the new wallet
      await setupWalletListeners(newWallet);
      
      setWalletEventId(newWallet.walletId || "default");
      setIsWalletReady(true);
      
      return true;
    } catch (e) {
      console.error("Create wallet error:", e);
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupWalletListeners]);

  // Load existing wallet / refresh balance
  const loadWallet = useCallback(async () => {
    if (cashuWalletRef.current) {
      await refreshBalance();
      return true;
    }
    return hasWallet;
  }, [hasWallet, refreshBalance]);

  // Deposit sats (create Lightning invoice)
  const deposit = useCallback(async (amount = 10) => {
    if (!cashuWalletRef.current) {
      setError("Wallet not initialized");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const wallet = cashuWalletRef.current;
      
      // Create deposit
      const depositHandler = wallet.deposit(amount, DEFAULT_MINT, "sat");
      
      // Get the Lightning invoice
      const pr = await depositHandler.start();
      console.log("[useCashuWallet] Invoice created:", pr?.substring(0, 50) + "...");
      setInvoice(pr);
      
      // Listen for success
      depositHandler.on("success", async (token) => {
        console.log("[useCashuWallet] Deposit successful!", token);
        
        // Wait for proofs to be stored
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check and refresh proofs
        try {
          await wallet.checkProofs();
        } catch (e) {
          console.warn("[useCashuWallet] checkProofs warning:", e);
        }
        
        // Refresh balance after delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshBalance();
        
        setInvoice("");
      });
      
      depositHandler.on("error", (e) => {
        console.error("[useCashuWallet] Deposit error:", e);
        setError(e.message || "Deposit failed");
        setInvoice("");
      });
      
      return pr;
    } catch (e) {
      console.error("Deposit error:", e);
      setError(e.message);
      setInvoice("");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  // Send sats to another npub via NIP-61 nutzap
  const send = useCallback(async (recipientNpub, amount, comment = "") => {
    if (!cashuWalletRef.current || !ndkRef.current || !signerRef.current) {
      setError("Wallet not initialized");
      return false;
    }
    
    // Refresh balance first to ensure we have accurate count
    const currentBalance = await refreshBalance();
    
    if (currentBalance < amount) {
      setError(`Insufficient balance. You have ${currentBalance} sats.`);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const wallet = cashuWalletRef.current;
      const ndk = ndkRef.current;
      const signer = signerRef.current;
      
      const recipientHex = decodeKey(recipientNpub);
      if (!recipientHex) {
        throw new Error("Invalid recipient npub");
      }
      
      // Fetch recipient's kind:10019 nutzap info
      const infoFilter = {
        kinds: [10019],
        authors: [recipientHex],
        limit: 1,
      };
      
      const infoEvents = await ndk.fetchEvents(infoFilter);
      const infoEventsArray = Array.from(infoEvents);
      
      let recipientMint = DEFAULT_MINT;
      let recipientP2pk = recipientHex;
      
      if (infoEventsArray.length > 0) {
        const infoEvent = infoEventsArray[0];
        for (const tag of infoEvent.tags) {
          if (tag[0] === "mint" && tag[1]) recipientMint = tag[1];
          if (tag[0] === "pubkey" && tag[1]) recipientP2pk = tag[1];
        }
      }
      
      // Use wallet's mints or default
      const mints = wallet.mints?.length > 0 ? wallet.mints : [DEFAULT_MINT];
      
      console.log("[useCashuWallet] Sending", amount, "sats to", recipientNpub);
      
      // Perform cashu payment - use sats directly
      const confirmation = await wallet.cashuPay({
        amount: amount,
        unit: "sat",
        mints,
        p2pk: recipientP2pk,
      });
      
      const { proofs, mint } = confirmation;
      if (!proofs || !mint) {
        throw new Error("Payment failed - no proofs returned");
      }
      
      console.log("[useCashuWallet] Payment proofs received:", proofs.length);
      
      // Create kind:9321 nutzap event
      const proofTags = proofs.map(proof => ["proof", JSON.stringify(proof)]);
      
      const nutzapEvent = new NDKEvent(ndk, {
        kind: 9321,
        content: comment,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ...proofTags,
          ["amount", amount.toString()],
          ["unit", "sat"],
          ["u", mint],
          ["p", recipientHex],
        ],
      });
      
      await nutzapEvent.sign(signer);
      await nutzapEvent.publish();
      
      console.log("[useCashuWallet] Nutzap published!");
      
      // Wait for wallet state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check proofs and refresh balance
      try {
        await wallet.checkProofs();
      } catch (e) {
        console.warn("[useCashuWallet] checkProofs warning:", e);
      }
      
      // Refresh balance
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshBalance();
      
      return true;
    } catch (e) {
      console.error("Send error:", e);
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [decodeKey, refreshBalance]);

  // Logout
  const logout = useCallback(() => {
    // Clear any pending timeouts
    if (balanceUpdateTimeoutRef.current) {
      clearTimeout(balanceUpdateTimeoutRef.current);
    }
    
    // Clear local storage
    localStorage.removeItem("cashu_npub");
    localStorage.removeItem("cashu_nsec");
    
    // Clear refs
    ndkRef.current = null;
    signerRef.current = null;
    walletServiceRef.current = null;
    cashuWalletRef.current = null;
    isInitializedRef.current = false;
    
    // Reset state
    setIsConnected(false);
    setNpub("");
    setNsec("");
    setHexPubkey("");
    setHexPrivkey("");
    setBalance(0);
    setInvoice("");
    setWalletEventId(null);
    setHasWallet(false);
    setIsWalletReady(false);
    setError(null);
  }, []);

  // Auto-restore session on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const storedNpub = localStorage.getItem("cashu_npub");
    const storedNsec = localStorage.getItem("cashu_nsec");
    
    if (storedNpub && storedNsec) {
      console.log("[useCashuWallet] Restoring session from localStorage");
      connect(storedNpub, storedNsec);
    }
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isConnected,
    isLoading,
    error,
    npub,
    nsec,
    balance,
    invoice,
    walletEventId,
    hasWallet,
    isWalletReady,
    
    // Actions
    connect,
    createUser,
    createWallet,
    loadWallet,
    deposit,
    send,
    logout,
    refreshBalance,
    
    // Utils
    clearError: () => setError(null),
  };
}

export default useCashuWallet;
