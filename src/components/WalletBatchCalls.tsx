"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useCapabilities,
  useSendCalls,
  useCallsStatus,
} from "wagmi";
import { parseEther } from "viem";

export default function WalletBatchCalls() {
  const { address, isConnected, chainId } = useAccount();
  const [callsId, setCallsId] = useState<string | null>(null);

  const {
    data: capabilities,
    isLoading: capsLoading,
    isError: capsError,
  } = useCapabilities({ query: { enabled: isConnected } });

  const { sendCalls, isPending, error } = useSendCalls();

  const { data: callsStatus } = useCallsStatus({
    id: callsId ?? "",
    query: { enabled: !!callsId, refetchInterval: 2000 },
  });

  // Check if connected wallet supports atomic batching on the current chain
  const chainCaps = chainId ? capabilities?.[chainId] : undefined;
  const supportsBatch = !!chainCaps?.atomicBatch?.supported;

  function handleSendBatch() {
    sendCalls(
      {
        calls: [
          {
            to: "0x0000000000000000000000000000000000000001" as const,
            value: parseEther("0.0001"),
          },
          {
            to: "0x0000000000000000000000000000000000000002" as const,
            value: parseEther("0.0001"),
          },
        ],
      },
      {
        onSuccess: (data) => {
          setCallsId(data.id);
        },
      }
    );
  }

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <h2 className="text-xl font-bold mb-2">
        Wallet Batch Calls (ERC-5792)
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        Uses <code className="text-blue-400">wallet_sendCalls</code> via wagmi.
        The connected wallet decides how to execute the batch — it may use
        EIP-7702 delegation behind the scenes to enable batching.
      </p>

      {/* Wallet connection */}
      <div className="mb-4">
        <ConnectButton showBalance={false} />
      </div>

      {isConnected && (
        <>
          <div className="mb-4 text-sm">
            <span className="text-gray-400">Connected: </span>
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 font-mono hover:underline"
            >
              {address}
            </a>
          </div>

          {/* Capability detection */}
          <div className="mb-4 p-3 rounded border text-sm">
            {capsLoading ? (
              <span className="text-gray-400">
                Checking wallet capabilities...
              </span>
            ) : capsError ? (
              <div className="border-yellow-700 bg-yellow-900/30">
                <p className="text-yellow-400 font-medium">
                  Wallet does not support ERC-5792
                </p>
                <p className="text-yellow-500 text-xs mt-1">
                  This wallet does not expose{" "}
                  <code>wallet_getCapabilities</code>. It likely does not
                  support <code>wallet_sendCalls</code> either.
                </p>
              </div>
            ) : supportsBatch ? (
              <div className="border-green-700 bg-green-900/30">
                <span className="text-green-400">
                  Wallet supports atomic batching on this chain
                </span>
              </div>
            ) : (
              <div className="border-yellow-700 bg-yellow-900/30">
                <p className="text-yellow-400">
                  No atomic batch support detected on chain {chainId}
                </p>
                <p className="text-yellow-500 text-xs mt-1">
                  Capabilities reported:{" "}
                  {chainCaps
                    ? JSON.stringify(chainCaps, null, 2)
                    : "none"}
                </p>
              </div>
            )}
          </div>

          {/* Supported wallets hint */}
          {(capsError || !supportsBatch) && !capsLoading && (
            <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700 text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">
                Wallets that support ERC-5792 batch calls:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  <strong>Coinbase Smart Wallet</strong> — native ERC-5792
                  support
                </li>
                <li>
                  <strong>MetaMask</strong> — enable &quot;Smart
                  Transactions&quot; in Settings → Experimental
                </li>
                <li>
                  <strong>Ambire Wallet</strong> — full ERC-5792 + 7702 support
                </li>
              </ul>
              <p className="mt-2">
                You can still test the <strong>Direct Delegation</strong> panel
                on the left with any Sepolia-funded private key.
              </p>
            </div>
          )}

          <button
            onClick={handleSendBatch}
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium text-sm mb-4"
          >
            {isPending ? "Waiting for wallet..." : "Send Batch Calls"}
          </button>

          <p className="text-gray-500 text-xs mb-4">
            Sends 2 tiny ETH transfers (0.0001 each) as a batch via the wallet.
            Your wallet may prompt you to upgrade to a smart account.
          </p>
        </>
      )}

      {/* Call status */}
      {callsId && (
        <div className="mt-2 text-sm">
          <span className="text-gray-400">Calls ID: </span>
          <span className="text-white font-mono text-xs">{callsId}</span>
        </div>
      )}

      {callsStatus && (
        <div className="mt-2 text-sm">
          <span className="text-gray-400">Status: </span>
          <span
            className={
              callsStatus.status === "success"
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {callsStatus.status}
          </span>
          {callsStatus.receipts?.[0]?.transactionHash && (
            <div className="mt-1">
              <span className="text-gray-400">Tx: </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${callsStatus.receipts[0].transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-mono text-xs hover:underline break-all"
              >
                {callsStatus.receipts[0].transactionHash}
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm break-all">
          {error.message}
          {error.message?.includes("unsupported contract") && (
            <p className="mt-2 text-yellow-400 text-xs">
              This means the EOA was previously delegated to a contract the
              wallet doesn&apos;t recognize. Use the{" "}
              <strong>Revoke Delegation</strong> button in the Direct Delegation
              panel to clear it, or use a different account.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
