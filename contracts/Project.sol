//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Project {
    enum State {ONGOING, FAIL, SUCCESS}

    address public owner;
    uint public goalAmount;
    uint public minAmount;
    uint256 public balance;
    uint public endDate;
    State public state;

    mapping (address => uint) public contributions;

    constructor(uint _goalAmount) {
        owner = msg.sender;
        goalAmount = _goalAmount;
        minAmount = 0.01 ether;
        balance = 0.00 ether;
        endDate = block.timestamp + 30 days;
        state = State.ONGOING;
    }

    modifier inState(State _state) {
        require(state == _state, 'PROJECT_STATe_MISMATCH');
        _;
    }

    modifier restricted() {
        require(msg.sender == owner, 'NOT_OWNER');
        _;
    }

    modifier expired(bool _expected) {
        if (_expected && block.timestamp > endDate) {
                state = State.FAIL;
        } else {
            require(block.timestamp <= endDate, 'PROJECT_EXPIRED');
        }
        _;
    }

    function invest() external expired(false) inState(State.ONGOING) payable {
        require(msg.value >= minAmount, 'LOWER_THAN_REQUIRE_MIN');

        balance += msg.value;
        contributions[msg.sender] += msg.value;
        //check to reword contributors
        if (balance >= goalAmount) {
            state = State.SUCCESS;
        }
    }

    function withdraw(uint _requestAmount) external inState(State.SUCCESS) restricted payable {
        payable(msg.sender).transfer(_requestAmount);
        balance = balance - _requestAmount;
    }

    function refund() external expired(true) inState(State.FAIL) payable {
        require(contributions[msg.sender] > 0, 'NON_SUFFICIENT_FUNDS');

        uint amountToRefund = contributions[msg.sender];
        payable(msg.sender).transfer(amountToRefund);
        balance -= amountToRefund;
        contributions[msg.sender] = 0;
    }

    function cancel() external expired(false) restricted {
        state = State.FAIL;
        emit CancelProject(msg.sender);
    }

    event CancelProject(address _ownerAddress);
}
