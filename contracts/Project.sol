//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Project {
    address public owner;
    uint public goalAmount;
    uint public minimumAmount;
    uint256 public balance;
    uint public endDate;

    constructor(uint _goalAmount) {
        owner = msg.sender;
        goalAmount = _goalAmount;
        minimumAmount = 0.01 ether;
        balance = 0.00 ether;
        endDate = block.timestamp + 30 days;
    }

}
