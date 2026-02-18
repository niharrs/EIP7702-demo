import DirectDelegation from "@/components/DirectDelegation";
import WalletBatchCalls from "@/components/WalletBatchCalls";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">EIP-7702 Demo</h1>
        <p className="text-gray-400 max-w-2xl">
          This app demonstrates triggering an EIP-7702 contract upgrade. An EOA
          can delegate to a smart contract, gaining capabilities like batch
          execution — all without migrating to a new address.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="font-semibold mb-2">How EIP-7702 works</h3>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-1">
          <li>
            The EOA signs an <strong>authorization</strong> designating a smart
            contract address
          </li>
          <li>
            A Type 4 transaction includes this authorization in its{" "}
            <code className="text-blue-400">authorizationList</code>
          </li>
          <li>
            The EOA now has a <strong>delegation indicator</strong> pointing to
            that contract&apos;s code
          </li>
          <li>
            Any call to the EOA executes the delegated contract&apos;s logic
            (e.g. batch calls)
          </li>
        </ol>
      </div>

      {/* Two demo panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DirectDelegation />
        <WalletBatchCalls />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-xs">
        <p>
          Network: Sepolia Testnet | Contract:{" "}
          <a
            href="https://sepolia.etherscan.io/address/0x4Cd241E8d1510e30b2076397afc7508Ae59C66c9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            BatchCallDelegation
          </a>
        </p>
      </div>
    </main>
  );
}
