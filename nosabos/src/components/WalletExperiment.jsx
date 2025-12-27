import { useState } from "react";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@chakra-ui/react";
import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";

import { Buffer } from "buffer";
window.Buffer = Buffer;

export default function WalletExperiment() {
  const {
    isConnected,
    errorMessage,
    nostrPubKey,
    generateNostrKeys,
    auth,
    authWithExtension,
    isNip07Available,
    ndk,
  } = useDecentralizedIdentity();

  const [username, setUsername] = useState("");
  const [nsecInput, setNsecInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [invoice, setInvoice] = useState(null);

  const [balance, setBalance] = useState(0);

  const [zapping, setZapping] = useState(false);

  const [proofs, setProofs] = useState([]);
  const mintUrl = "https://mint.minibits.cash/Bitcoin";

  const handleCreateWallet = async () => {
    if (!ndk || !isConnected || !ndk.signer) {
      console.error("NDK not ready or user not authenticated");
      return;
    }

    setWalletLoading(true);
    try {
      const cashuWallet = new NDKCashuWallet(ndk);

      const user = await ndk.signer.user();
      await cashuWallet.start({ pubkey: user.pubkey });

      // Get loaded proofs
      const loadedProofs =
        cashuWallet.state?.getProofs({ mint: mintUrl }) || [];
      console.log("Loaded proofs from relay:", loadedProofs);
      console.log(
        "Loaded balance:",
        loadedProofs.reduce((sum, p) => sum + p.amount, 0)
      );

      if (loadedProofs.length > 0) {
        // Verify proofs are still valid with the mint
        const cashuWalletInstance = await cashuWallet.getCashuWallet(mintUrl);
        const proofStates = await cashuWalletInstance.checkProofsStates(
          loadedProofs
        );
        console.log("Proof states from mint:", proofStates);

        // Filter to only unspent proofs
        const unspentProofs = loadedProofs.filter((proof, i) => {
          const state = proofStates[i];
          console.log(`Proof ${i} (${proof.amount} sats):`, state);
          return state?.state === "UNSPENT";
        });

        console.log("Unspent proofs:", unspentProofs);
        console.log(
          "Actual balance:",
          unspentProofs.reduce((sum, p) => sum + p.amount, 0)
        );

        setProofs(unspentProofs);
        setBalance(unspentProofs.reduce((sum, p) => sum + p.amount, 0));
      }

      ndk.wallet = cashuWallet;
      setWallet(cashuWallet);
    } catch (err) {
      console.error("Failed to create wallet:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!wallet) return;

    try {
      const depositObj = wallet.deposit(10, mintUrl);

      depositObj.on("success", async (token) => {
        console.log("Deposit successful:", token.proofs);
        setProofs(token.proofs);
        setBalance(token.proofs.reduce((sum, p) => sum + p.amount, 0));

        // Persist using wallet.state.update
        await wallet.state.update({
          store: token.proofs,
          mint: mintUrl,
        });
        console.log("Proofs saved to relay");

        setInvoice(null);
      });

      depositObj.on("error", (error) => {
        console.error("Deposit error:", error);
      });

      const invoiceData = await depositObj.start();
      console.log("Invoice:", invoiceData);
      setInvoice(invoiceData);
    } catch (err) {
      console.error("Deposit error:", err);
    }
  };

  const handleZap = async () => {
    setZapping(true);

    try {
      if (proofs.length === 0) {
        console.error("No proofs available");
        setZapping(false);
        return;
      }

      const user = await NDKUser.fromNip05("sheilfer@cash.app", ndk);
      await user.fetchProfile();

      const lnurlResponse = await fetch(
        "https://primal.net/.well-known/lnurlp/sheilfer"
      );
      const lnurlData = await lnurlResponse.json();

      const zapRequest = new NDKEvent(ndk, {
        kind: 9734,
        content: "I'm sending you a cent of Bitcoin!",
        tags: [
          ["p", user.pubkey],
          ["amount", "1000"],
          ["relays", "wss://relay.damus.io", "wss://relay.primal.net"],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await zapRequest.sign(ndk.signer);

      const callbackUrl = new URL(lnurlData.callback);
      callbackUrl.searchParams.set("amount", "1000");
      callbackUrl.searchParams.set(
        "nostr",
        JSON.stringify(zapRequest.rawEvent())
      );

      const invoiceResponse = await fetch(callbackUrl.toString());
      const invoiceData = await invoiceResponse.json();

      if (invoiceData.pr) {
        const cashuWallet = await wallet.getCashuWallet(mintUrl);

        const meltQuote = await cashuWallet.createMeltQuote(invoiceData.pr);
        console.log("Melt quote:", meltQuote);

        const meltResult = await cashuWallet.meltProofs(meltQuote, proofs);
        console.log("Melt result:", meltResult);

        if (meltResult.change && meltResult.change.length > 0) {
          setProofs(meltResult.change);
          setBalance(meltResult.change.reduce((sum, p) => sum + p.amount, 0));

          // Save change and mark spent proofs as destroyed
          await wallet.state.update({
            store: meltResult.change,
            destroy: proofs,
            mint: mintUrl,
          });
          console.log("Change saved, spent proofs destroyed");
        } else {
          setProofs([]);
          setBalance(0);

          // Mark all proofs as destroyed
          await wallet.state.update({
            destroy: proofs,
            mint: mintUrl,
          });
        }

        console.log("Zap successful!");
      }
    } catch (err) {
      console.error("Zap failed:", err.message);
    } finally {
      setZapping(false);
    }
  };

  const handleGenerateKeys = async () => {
    if (!username.trim()) return;
    setLoading(true);
    await generateNostrKeys(username);
    setLoading(false);
  };

  const handleNsecLogin = async () => {
    if (!nsecInput.trim() || !nsecInput.startsWith("nsec")) return;
    setLoading(true);
    await auth(nsecInput);
    setLoading(false);
  };

  const handleExtensionLogin = async () => {
    setLoading(true);
    await authWithExtension();
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Wallet Experiment</h2>

      <p>Relay Status: {isConnected ? "✅ Connected" : "⏳ Connecting..."}</p>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {nostrPubKey ? (
        <div>
          <h3>Logged In</h3>
          <p style={{ wordBreak: "break-all", fontSize: "12px" }}>
            {nostrPubKey}
          </p>
          {!wallet ? (
            <Button onClick={handleCreateWallet} disabled={walletLoading}>
              {walletLoading ? "Creating..." : "Create Wallet"}
            </Button>
          ) : (
            <div>
              <p>✅ Wallet created</p>
            </div>
          )}

          {wallet && !invoice && (
            <Button onClick={handleDeposit}>Deposit 10 sats</Button>
          )}

          {invoice && (
            <div style={{ textAlign: "center" }}>
              <p>Pay 10 sats:</p>
              <QRCodeSVG value={invoice} size={200} />
              <Button
                onClick={() => setInvoice(null)}
                style={{ marginTop: "10px" }}
              >
                Cancel
              </Button>
            </div>
          )}

          {wallet && (
            <Button onClick={handleZap} disabled={zapping || balance < 1}>
              {zapping ? "Zapping..." : "Zap 1 sat to sheilfer@primal.net"}
            </Button>
          )}

          <p>Balance: {balance} sats</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <h4>Create New Account</h4>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />
            <button onClick={handleGenerateKeys} disabled={loading}>
              {loading ? "Creating..." : "Generate Keys"}
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4>Login with nsec</h4>
            <input
              type="password"
              placeholder="nsec1..."
              value={nsecInput}
              onChange={(e) => setNsecInput(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />
            <button onClick={handleNsecLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          {isNip07Available() && (
            <div>
              <h4>Login with Extension</h4>
              <button onClick={handleExtensionLogin} disabled={loading}>
                {loading ? "Connecting..." : "Use Browser Extension"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
