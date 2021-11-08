# Crowdfundr
A client hires you to build them a "kickstarter clone". They give you the following spec:

> Build a smart contract that allows creators to register their projects. Other people can contribute ETH to that project. Once the goal has been met, the creators can withdraw the funds. When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable.

#### TODOs
- [] Create Project contract constructor
- [] Implement status
- [] Implement invest function
- [] Impelemnt refund function
- [] Impelemnt withdraw function
- [] Implement reward function

### Structure
**Project Contract**
| Properties | Type | Value |
| ------ | ------ | ------ |
| Owner | address | |
| Goal Amount | uint | 0.00 ETH |
| Minimum Amount | uint | 0.01 ETH |
| End Date | uint | 30day |
| Status | Status | InProgress, FAIL, SUCCESS |
| Current Balance | uint | 0.00 ETH |

Functions
- invest
- reward
- refund
- withdraw