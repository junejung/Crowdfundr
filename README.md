# Crowdfundr
A client hires you to build them a "kickstarter clone". They give you the following spec:

> Build a smart contract that allows creators to register their projects. Other people can contribute ETH to that project. Once the goal has been met, the creators can withdraw the funds. When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable.

- The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
  - Specifically, you should use the factory contract pattern.
- The goal is a preset amount of ETH.
  - This cannot be changed after a project gets created.
- Regarding contributing:
  - The contribute amount must be at least 0.01 ETH.
  - There is no upper limit.
  - Anyone can contribute to the project, including the creator.
  - One address can contribute as many times as they like.
  - No one can withdraw their funds until the project either fails or gets cancelled.
- Regarding contributer badges:
  - An address receives a badge if their **total contribution** is at least 1 ETH.
  - One address can receive multiple badges, but should only receive 1 badge per 1 ETH.
- If the project is not fully funded within 30 days:
  - The project goal is considered to have failed.
  - No one can contribute anymore.
  - Supporters get their money back.
  - Contributor badges are left alone. They should still be tradable.
- Once a project becomes fully funded:
  - No one else can contribute (however, the last contribution can go over the goal).
  - The creator can withdraw any amount of contributed funds.
- The creator can choose to cancel their project before the 30 days are over, which has the same effect as a project failing.

#### TODOs
- [X] Create Project contract constructor
- [X] Implement status
- [X] Implement invest function
- [X] Implement reward function
- [X] Implement refund function
- [X] Implement withdraw function
- [X] Implement cancel function
- [] Creat factory contract
- [] Refactor source and test code
- [] Add how to in readme

### Structure
**Project Contract**
| Properties | Type | Value |
| ------ | ------ | ------ |
| Owner | address | |
| Goal Amount | uint | 0.00 ETH |
| Minimum Amount | uint | 0.01 ETH |
| End Date | uint | 30day |
| Status | Status | INPROGRESS, FAIL, SUCCESS |
| Balance | uint | 0.00 ETH |

Functions
- invest
- reward
- refund
- withdraw