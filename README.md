# Crowdfundr
A client hires you to build them a "kickstarter clone". They give you the following spec:

> Build a smart contract that allows creators to register their projects. Other people can contribute ETH to that project. Once the goal has been met, the creators can withdraw the funds. When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable.


## Full Spac
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

## Tasks
- [X] Create a factory contract for projects.
- [X] Implement invest and restrict the contribution to be more than 0.01 ETH.
- [X] Impelement cancel that's only callable by the owner of the project and when the project hasn't expired.
- [X] Impelemnt refund that's callable by contributors when the project is failed or canceled.
- [X] Impelement reward for giving contributor a NFT per 1 ETH contribution.
- [X] Impelement state and expire modifier to check the project's status and restrict the other functions.
- [X] Impelement withdraw that's only callable by the owner of the project when the project is successfully ended.

## Implementation
### Crowdfundr

##### creatProject
Callable by anyone. It requires a target/goal amount of the project in ETH.
Calling this function will initiate a new project contract and set values below.
| Values |  |
| ------ | ------ |
| _owner_ | The address of the project creator. It sets to be the caller of createProject function.|
| _goalAmount_ | The target/goal that passed in the creatProject call.|
| _balance_ | The current balance of the project in ETH. it sets to 0 ETH in the creation of the project.|
| _endDate_ | The date that the project ends. It sets to be 30 days from the creation of the project. |
| _state_ | The state of the project. It has three states: ONGOING, FAIL, SUCCESS. It sets to ONGOING in the creation of the project. |

##### getAllProjects
It returns the project contract address of the array that has been created.

### Project
Inherited from ERC721.

##### Invest
Callable by anyone, including the owner of the project when the project in the ONGOING state.

##### refund
Callable by contributors when the project is canceled or expired.

##### withdraw
Callable by the owner of the project only when the project is completed successfully.

##### cancel
Callable by the owner of the project only when the project is the ONGOING state.

## Design Exercises
> Smart contracts have a hard limit of 24kb. Crowdfundr hands out an NFT to everyone who contributes. However, consider how Kickstarter has multiple contribution tiers. How would you design your contract to support this, without creating three separate NFT contracts?

Creating tokens that have the tier information encoded.
```
function _rewardFortier(uint value) internal {
        if ( ConditionToDeterminTheFirstTier ) {
            _mint(3, msg.sender); // 1st tier
        } else if ( ConditionToDeterminThe2ndTier ) {
            _mint(2, msg.sender); // 2nd tier
        } else {
            _mint(1, msg.sender); // 3rd tier
        }
    }
```
In _mint:
```
(idCounter << 1) + tierType;
idCounter++;
```
