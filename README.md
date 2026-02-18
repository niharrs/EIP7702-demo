# EIP-7702 Demo

A Next.js app that demonstrates triggering an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) smart account upgrade on Ethereum Sepolia. An EOA can delegate to a smart contract, gaining capabilities like batch execution — without migrating to a new address.

## How EIP-7702 Works

1. The EOA signs an **authorization** designating a smart contract address
2. A **Type 4 transaction** includes this authorization in its `authorizationList`
3. The EOA now has a **delegation indicator** pointing to that contract's code
4. Any call to the EOA executes the delegated contract's logic (e.g. batch calls)

## Demo Modes

### Direct EIP-7702 Delegation

Uses a local private key with viem's `signAuthorization` + `sendTransaction` to directly send a Type 4 transaction. This is the raw protocol-level flow where **you control which contract** the EOA delegates to.

```ts
// Sign the authorization
const authorization = await walletClient.signAuthorization({
  contractAddress: BATCH_CALL_DELEGATION_ADDRESS,
  executor: "self",
});

// Send the Type 4 delegation transaction
const hash = await walletClient.sendTransaction({
  authorizationList: [authorization],
  to: account.address,
  data: "0x",
});
```

After delegation, the EOA can execute batch calls through the delegated `BatchCallDelegation` contract. You can also revoke the delegation at any time.

### Wallet Batch Calls (ERC-5792)

Uses wagmi's `useSendCalls` hook to send batched calls via `wallet_sendCalls`. The connected wallet decides how to execute the batch — it may use EIP-7702 behind the scenes with its own whitelisted delegation contract.

```ts
sendCalls({
  calls: [
    { to: "0x...", value: parseEther("0.0001") },
    { to: "0x...", value: parseEther("0.0001") },
  ],
});
```

> **Note:** Not all wallets support ERC-5792 yet. Coinbase Smart Wallet and MetaMask (with Smart Transactions enabled) are among those that do.

## Tech Stack

- **Next.js 14** (App Router)
- **viem** — EIP-7702 `signAuthorization`, `sendTransaction`
- **wagmi** — wallet connection, `useSendCalls`, `useCapabilities`
- **RainbowKit** — wallet connect UI
- **Tailwind CSS** — styling
- **Network:** Sepolia testnet

## Getting Started

### Prerequisites

- Node.js 18+
- A Sepolia-funded wallet (get testnet ETH from [sepoliafaucet.com](https://sepoliafaucet.com))

### Setup

```bash
git clone https://github.com/niharrs/EIP7702-demo.git
cd EIP7702-demo
npm install
```

Copy the example env file and configure your RPC:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with a reliable Sepolia RPC URL. Public RPCs get rate-limited, so a free [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io) key is recommended:

```
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main page with both demo panels
│   └── globals.css             # Tailwind styles
├── components/
│   ├── Providers.tsx           # Wagmi + RainbowKit + React Query
│   ├── DirectDelegation.tsx    # Raw EIP-7702 via private key
│   └── WalletBatchCalls.tsx    # ERC-5792 via connected wallet
├── config/
│   └── wagmi.ts                # Wagmi config (Sepolia)
└── lib/
    └── contracts.ts            # BatchCallDelegation ABI + address
contracts/
    └── BatchCallDelegation.sol # Delegation contract source
```

## Delegation Contract

The demo uses `BatchCallDelegation` — a minimal contract that enables batch execution from a delegated EOA:

```solidity
contract BatchCallDelegation {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    function execute(Call[] calldata calls) external payable {
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, ) = calls[i].target.call{value: calls[i].value}(calls[i].data);
            require(success, "call failed");
        }
    }
}
```

## Key Differences Between the Two Approaches

| | Direct Delegation | Wallet Batch Calls |
|---|---|---|
| Who signs the 7702 auth? | Your app (viem + private key) | The wallet (internally) |
| Who picks the delegation contract? | You | Wallet (from its whitelist) |
| Transaction type | Explicit Type 4 with `authorizationList` | `wallet_sendCalls` RPC |
| Works with any EOA? | Yes, with the private key | Only if wallet supports ERC-5792 |

## Resources

- [EIP-7702 Spec](https://eips.ethereum.org/EIPS/eip-7702)
- [EIP-7702 Overview](https://eip7702.io)
- [Viem EIP-7702 Docs](https://viem.sh/docs/eip7702/sending-transactions)
- [ERC-5792: Wallet Call API](https://eips.ethereum.org/EIPS/eip-5792)
- [ERC-7902: Wallet Capabilities for Account Abstraction](https://eips.ethereum.org/EIPS/eip-7902)
