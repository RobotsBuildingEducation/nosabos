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
  
  // NDK instances
  const ndkRef = useRef(null);
  const signerRef = useRef(null);
  const walletServiceRef = useRef(null);
  const cashuWalletRef = useRef(null);
  const isInitializedRef = useRef(false);

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

  // Setup wallet listeners
  const setupWalletListeners = useCallback(async (wallet) => {
    if (!wallet || !(wallet instanceof NDKCashuWallet)) return;
    
    console.log("[useCashuWallet] Setting up wallet listeners");
    
    // Listen for balance updates
    wallet.on("balance_updated", async () => {
      const bal = await wallet.balance();
      const totalBalance = Array.isArray(bal)
        ? bal.reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
        : Number(bal?.amount || bal || 0);
      console.log("[useCashuWallet] Balance updated:", totalBalance);
      setBalance(totalBalance);
    });
    
    // Get initial balance
    const initialBal = await wallet.balance();
    const totalBalance = Array.isArray(initialBal)
      ? initialBal.reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
      : Number(initialBal?.amount || initialBal || 0);
    
    console.log("[useCashuWallet] Initial balance:", totalBalance);
    setBalance(totalBalance);
    cashuWalletRef.current = wallet;
    setHasWallet(true);
  }, []);

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
        console.log("[useCashuWallet] Default wallet detected");
        setWalletEventId(wallet?.walletId || "default");
        setupWalletListeners(wallet);
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
      
      // Reinitialize wallet service to detect new wallet
      await initWalletService(ndk, signer);
      
      // Setup listeners
      await setupWalletListeners(newWallet);
      
      setWalletEventId(newWallet.walletId || "default");
      setHasWallet(true);
      
      return true;
    } catch (e) {
      console.error("Create wallet error:", e);
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initWalletService, setupWalletListeners]);

  // Load existing wallet
  const loadWallet = useCallback(async () => {
    // Wallet loading happens automatically via wallet service
    // This is just a manual trigger to check
    if (walletServiceRef.current && cashuWalletRef.current) {
      const bal = await cashuWalletRef.current.balance();
      const totalBalance = Array.isArray(bal)
        ? bal.reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
        : Number(bal?.amount || bal || 0);
      setBalance(totalBalance);
      return true;
    }
    return hasWallet;
  }, [hasWallet]);

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
        console.log("[useCashuWallet] Deposit successful!");
        
        // Check proofs
        await wallet.checkProofs();
        
        // Update balance
        const updatedBal = await wallet.balance();
        const totalBalance = Array.isArray(updatedBal)
          ? updatedBal.reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
          : Number(updatedBal?.amount || updatedBal || 0);
        
        setBalance(totalBalance);
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
  }, []);

  // Send sats to another npub via NIP-61 nutzap
  const send = useCallback(async (recipientNpub, amount, comment = "") => {
    if (!cashuWalletRef.current || !ndkRef.current || !signerRef.current) {
      setError("Wallet not initialized");
      return false;
    }
    
    if (balance < amount) {
      setError("Insufficient balance");
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
      
      // Perform cashu payment
      const confirmation = await wallet.cashuPay({
        amount: amount * 1000, // Convert to msats
        unit: "msat",
        mints,
        p2pk: recipientP2pk,
      });
      
      const { proofs, mint } = confirmation;
      if (!proofs || !mint) {
        throw new Error("Payment failed - no proofs returned");
      }
      
      // Create kind:9321 nutzap event
      const proofData = JSON.stringify({ proofs, mint });
      
      const nutzapEvent = new NDKEvent(ndk, {
        kind: 9321,
        content: comment,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["amount", (amount * 1000).toString()],
          ["unit", "msat"],
          ["proof", proofData],
          ["u", mint],
          ["p", recipientHex],
        ],
      });
      
      await nutzapEvent.sign(signer);
      await nutzapEvent.publish();
      
      console.log("[useCashuWallet] Nutzap sent!");
      
      // Update balance
      await wallet.checkProofs();
      const updatedBal = await wallet.balance();
      const totalBalance = Array.isArray(updatedBal)
        ? updatedBal.reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0)
        : Number(updatedBal?.amount || updatedBal || 0);
      
      setBalance(totalBalance);
      
      return true;
    } catch (e) {
      console.error("Send error:", e);
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [balance, decodeKey]);

  // Logout
  const logout = useCallback(() => {
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
    
    // Actions
    connect,
    createUser,
    createWallet,
    loadWallet,
    deposit,
    send,
    logout,
    
    // Utils
    clearError: () => setError(null),
  };
}

export default useCashuWallet;
