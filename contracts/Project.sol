//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Project {
    address public owner;
    uint public goalAmount;
    uint public minAmount;
    uint256 public balance;
    uint public endDate;
    bool public goalMet;

    mapping (address => uint) public contributions;

    constructor(uint _goalAmount) {
        owner = msg.sender;
        goalAmount = _goalAmount;
        minAmount = 0.01 ether;
        balance = 0.00 ether;
        endDate = block.timestamp + 30 days;
        goalMet = false;
    }

    modifier achieved(bool _expected) {
        require(goalMet == _expected, 'PROJECT_STATUS_MISMATCH');
        _;
    }

    modifier restricted() {
        require(msg.sender == owner, 'NOT_OWNER');
        _;
    }

    modifier expired(bool _expected) {
        if (_expected) {
            require(block.timestamp >= endDate, 'PROJECT_STILL_IN_PROGRESS');
        } else {
            require(block.timestamp <= endDate, 'PROJECT_EXPIRED');
        }
        _;
    }

    function invest() external achieved(false) expired(false) payable {
        require(msg.value >= minAmount, 'LOWER_THAN_REQUIRE_MIN');

        balance += msg.value;
        contributions[msg.sender] += msg.value;
        //check to reword contributors
        if (balance >= goalAmount) {
            goalMet = true;
        }
    }

    function withdraw(uint _requestAmount) external achieved(true) restricted payable {
        payable(msg.sender).transfer(_requestAmount);
        balance = balance - _requestAmount;
    }

    function refund() external achieved(false) expired(true) payable {
        require(contributions[msg.sender] > 0, 'NON_SUFFICIENT_FUNDS');

        uint amountToRefund = contributions[msg.sender];
        payable(msg.sender).transfer(amountToRefund);
        balance -= amountToRefund;
        contributions[msg.sender] = 0;
    }
}
