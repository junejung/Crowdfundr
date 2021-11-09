//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Project {
    enum Status { INPROGRESS, SUCCESS, FAIL }

    address public owner;
    uint public goalAmount;
    uint public minAmount;
    uint256 public balance;
    uint public endDate;
    Status public status;

    constructor(uint _goalAmount) {
        owner = msg.sender;
        goalAmount = _goalAmount;
        minAmount = 0.01 ether;
        balance = 0.00 ether;
        endDate = block.timestamp + 30 days;
        status = Status.INPROGRESS;
    }

    modifier inStatus(Status _status) {
        require(status == _status);
        _;
    }

    function invest() external inStatus(Status.INPROGRESS) payable {
        require(msg.value >= minAmount, 'The contribute amount must be at least 0.01 ETH.');
        
        balance = balance +=msg.value;
        if(balance >= goalAmount) {
            status = Status.SUCCESS;
        }
    }

}
