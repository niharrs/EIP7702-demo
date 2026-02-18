// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BatchCallDelegation
/// @notice A minimal EIP-7702 delegation contract that enables batch execution.
///         An EOA delegates to this contract, then can execute multiple calls in one tx.
contract BatchCallDelegation {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    /// @notice Execute a batch of calls from the delegated EOA.
    function execute(Call[] calldata calls) external payable {
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, ) = calls[i].target.call{value: calls[i].value}(
                calls[i].data
            );
            require(success, "BatchCallDelegation: call failed");
        }
    }
}
