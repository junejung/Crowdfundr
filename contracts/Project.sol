//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Crowdfundr {
    Project[] private projects;

    function createProject(uint _goal) external {
        Project newProject = new Project(msg.sender, _goal);

        address newProjectAddress = address(newProject);
        projects.push(newProject);

        emit ProjectCreated(address(newProjectAddress), msg.sender, _goal);
    }

    function getAllProjects() external view returns(Project[] memory){
        return projects;
    }

    event ProjectCreated(address _contractAddress, address _creator, uint256 _goal);
}

contract Project is ERC721 {

    enum State {ONGOING, FAIL, SUCCESS}

    address public owner;
    uint public goalAmount;
    uint public minAmount;
    uint256 public balance;
    uint public endDate;
    uint256 private _tokenIdCounter;
    State public state;

    mapping (address => uint) public contributions;
    mapping (address => uint[]) public givenNFTs;

    constructor(address _owner, uint _goal) ERC721("CrowdfundrReward", "NFT") {
        owner = _owner;
        goalAmount = _goal;
        minAmount = 0.01 ether;
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

    function _mint(address _recipient) internal returns (uint256) {
        _safeMint(_recipient, _tokenIdCounter++);

        return _tokenIdCounter;
    }

    function _reward(address _recipient) internal inState(State.ONGOING) {
        uint nftsToGive = (contributions[_recipient] - givenNFTs[_recipient].length) / (1 ether);
        for (uint i; i < nftsToGive; i++) {
            givenNFTs[_recipient].push(_mint(_recipient));
        }

        emit RewardGiven(_recipient, givenNFTs[_recipient].length);
    }

    function _send(address _to, uint amount) public payable {
        (bool result, ) = _to.call{value: amount}("");
        require(result, "TRANSACTION_FAILED");
    }

    function invest() external expired(false) inState(State.ONGOING) payable {
        require(msg.value >= minAmount, 'LOWER_THAN_REQUIRE_MIN');

        balance += msg.value;
        contributions[msg.sender] += msg.value;

        _reward(msg.sender);

        if (balance >= goalAmount) {
            state = State.SUCCESS;
        }
    }

    function withdraw(uint _requestAmount) external inState(State.SUCCESS) restricted payable {
        balance = balance - _requestAmount;

        _send(payable(msg.sender), _requestAmount);
    }

    function refund() external expired(true) inState(State.FAIL) payable {
        require(contributions[msg.sender] > 0, 'NON_SUFFICIENT_FUNDS');

        uint amountToRefund = contributions[msg.sender];
        balance -= amountToRefund;
        contributions[msg.sender] = 0;

         _send(payable(msg.sender), amountToRefund);
    }

    function cancel() external expired(false) restricted {
        state = State.FAIL;

        emit projectCancelled(msg.sender);
    }

    event projectCancelled(address _ownerAddress);

    event RewardGiven(address _recipient, uint _givenNftNO);
}
