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
        require(status == _status, 'INVALID_STATUS');
        _;
    }

    modifier restricted() {
        require(msg.sender == owner, 'NOT_OWNER');
        _;
    }

    function invest() external inStatus(Status.INPROGRESS) payable {
        require(msg.value >= minAmount, 'LOWER_THAN_REQUIRE_MIN');
        updateStatus();

        balance = balance +=msg.value;
        updateStatus();
    }

    function updateStatus() internal inStatus(Status.INPROGRESS) {
        if (balance >= goalAmount) {
            status = Status.SUCCESS;
        } else if (block.timestamp > endDate) {
            status = Status.FAIL;
        }
    }

    function withdraw(uint _requestAmount) external inStatus(Status.SUCCESS) restricted payable {
        transfer(payable(msg.sender), _requestAmount);
        balance = balance - _requestAmount;
    }

    function transfer(address payable _to, uint _amount) internal {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "TRANSFER_FAILED");
    }
}
