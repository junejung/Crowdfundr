//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Project {
    address public owner;
    uint public goalAmount;
    uint public minAmount;
    uint256 public balance;
    uint public endDate;

    constructor(uint _goalAmount) {
        owner = msg.sender;
        goalAmount = _goalAmount;
        minAmount = 0.01 ether;
        balance = 0.00 ether;
        endDate = block.timestamp + 30 days;
    }

    function invest() external payable {
        // check if project is still on going
        require(msg.value >= minAmount, 'The contribute amount must be at least 0.01 ETH.');
        require(balance < goalAmount, 'The goal alreay met.');

        balance = balance +=msg.value;
        // check if project meet its goal
    }

}
