"use client";

import { useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  parseEther,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  BATCH_CALL_DELEGATION_ABI,
  BATCH_CALL_DELEGATION_ADDRESS,
} from "@/lib/contracts";

const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://1rpc.io/sepolia";

type Status = "idle" | "signing" | "sending" | "success" | "error";

export default function DirectDelegation() {
  const [privateKey, setPrivateKey] = useState("");
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC);
  const [status, setStatus] = useState<Status>("idle");
  const [delegationTxHash, setDelegationTxHash] = useState<string | null>(null);
  const [batchTxHash, setBatchTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eoaAddress, setEoaAddress] = useState<string | null>(null);
  const [isDelegated, setIsDelegated] = useState(false);
  const [revokeTxHash, setRevokeTxHash] = useState<string | null>(null);

  function getPublicClient() {
    return createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  function getWalletClient(key: Hex) {
    return createWalletClient({
      account: privateKeyToAccount(key),
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  function normalizeKey(): Hex {
    return (
      privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
    ) as Hex;
  }

  async function handleDelegate() {
    setError(null);
    setDelegationTxHash(null);

    try {
      const key = normalizeKey();
      const account = privateKeyToAccount(key);
      setEoaAddress(account.address);

      const walletClient = getWalletClient(key);

      // Step 1: Sign the EIP-7702 authorization
      setStatus("signing");
      const authorization = await walletClient.signAuthorization({
        contractAddress: BATCH_CALL_DELEGATION_ADDRESS,
        executor: "self",
      });

      // Step 2: Send the delegation transaction
      setStatus("sending");
      const hash = await walletClient.sendTransaction({
        authorizationList: [authorization],
        to: account.address,
        data: "0x" as Hex,
      });

      setDelegationTxHash(hash);
      setIsDelegated(true);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function handleBatchCall() {
    setError(null);
    setBatchTxHash(null);

    try {
      const key = normalizeKey();
      const account = privateKeyToAccount(key);
      const walletClient = getWalletClient(key);

      const data = encodeFunctionData({
        abi: BATCH_CALL_DELEGATION_ABI,
        functionName: "execute",
        args: [
          [
            {
              target: "0x0000000000000000000000000000000000000001" as const,
              value: parseEther("0.0001"),
              data: "0x" as Hex,
            },
            {
              target: "0x0000000000000000000000000000000000000002" as const,
              value: parseEther("0.0001"),
              data: "0x" as Hex,
            },
          ],
        ],
      });

      setStatus("sending");
      const hash = await walletClient.sendTransaction({
        to: account.address,
        data,
        value: parseEther("0.0002"),
      });

      setBatchTxHash(hash);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function handleRevoke() {
    setError(null);
    setRevokeTxHash(null);

    try {
      const key = normalizeKey();
      const account = privateKeyToAccount(key);
      const walletClient = getWalletClient(key);

      // Delegate to address(0) to clear the delegation
      setStatus("signing");
      const authorization = await walletClient.signAuthorization({
        contractAddress: "0x0000000000000000000000000000000000000000",
        executor: "self",
      });

      setStatus("sending");
      const hash = await walletClient.sendTransaction({
        authorizationList: [authorization],
        to: account.address,
        data: "0x" as Hex,
      });

      setRevokeTxHash(hash);
      setIsDelegated(false);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function checkDelegation() {
    if (!eoaAddress) return;
    try {
      const code = await getPublicClient().getCode({
        address: eoaAddress as Hex,
      });
      if (code && code !== "0x") {
        setIsDelegated(true);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <h2 className="text-xl font-bold mb-2">
        Direct EIP-7702 Delegation
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        Uses a local private key to sign a 7702 authorization and send a Type 4
        transaction directly. This delegates the EOA to the{" "}
        <code className="text-blue-400">BatchCallDelegation</code> contract.
      </p>

      {/* RPC URL input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Sepolia RPC URL
        </label>
        <input
          type="text"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-xs"
        />
        <p className="text-gray-500 text-xs mt-1">
          Public RPCs get rate-limited. For reliable results, use a free{" "}
          <a
            href="https://www.alchemy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Alchemy
          </a>{" "}
          or{" "}
          <a
            href="https://www.infura.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Infura
          </a>{" "}
          Sepolia RPC URL.
        </p>
      </div>

      {/* Private key input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Private Key (Sepolia testnet only!)
        </label>
        <input
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
        />
        <p className="text-yellow-500 text-xs mt-1">
          Only use a testnet key with Sepolia ETH. Never enter a mainnet private
          key.
        </p>
      </div>

      {eoaAddress && (
        <div className="mb-4 text-sm">
          <span className="text-gray-400">EOA: </span>
          <a
            href={`https://sepolia.etherscan.io/address/${eoaAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-mono hover:underline"
          >
            {eoaAddress}
          </a>
          {isDelegated && (
            <span className="ml-2 text-green-400 text-xs">(delegated)</span>
          )}
        </div>
      )}

      {/* Delegate button */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          onClick={handleDelegate}
          disabled={!privateKey || status === "signing" || status === "sending"}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium text-sm"
        >
          {status === "signing"
            ? "Signing authorization..."
            : status === "sending"
              ? "Sending tx..."
              : "1. Delegate to BatchCallDelegation"}
        </button>

        <button
          onClick={handleBatchCall}
          disabled={!isDelegated || status === "sending"}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium text-sm"
        >
          2. Execute Batch Call
        </button>

        <button
          onClick={handleRevoke}
          disabled={!privateKey || status === "signing" || status === "sending"}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium text-sm"
        >
          Revoke Delegation
        </button>

        {eoaAddress && (
          <button
            onClick={checkDelegation}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
          >
            Check Delegation
          </button>
        )}
      </div>

      {/* Results */}
      {delegationTxHash && (
        <div className="mb-2 text-sm">
          <span className="text-gray-400">Delegation tx: </span>
          <a
            href={`https://sepolia.etherscan.io/tx/${delegationTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-mono text-xs hover:underline break-all"
          >
            {delegationTxHash}
          </a>
        </div>
      )}

      {revokeTxHash && (
        <div className="mb-2 text-sm">
          <span className="text-gray-400">Revoke tx: </span>
          <a
            href={`https://sepolia.etherscan.io/tx/${revokeTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-mono text-xs hover:underline break-all"
          >
            {revokeTxHash}
          </a>
        </div>
      )}

      {batchTxHash && (
        <div className="mb-2 text-sm">
          <span className="text-gray-400">Batch call tx: </span>
          <a
            href={`https://sepolia.etherscan.io/tx/${batchTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-mono text-xs hover:underline break-all"
          >
            {batchTxHash}
          </a>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm break-all">
          {error}
        </div>
      )}
    </div>
  );
}
