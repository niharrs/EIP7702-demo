export const BATCH_CALL_DELEGATION_ABI = [
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

// Simple BatchCallDelegation contract address on Sepolia.
// If you deploy your own, replace this address.
// This is the example contract from viem docs / eip7702.io.
export const BATCH_CALL_DELEGATION_ADDRESS =
  "0x4Cd241E8d1510e30b2076397afc7508Ae59C66c9" as const;
