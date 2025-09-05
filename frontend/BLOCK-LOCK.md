# blocklock-solidity

[![Solidity ^0.8.x](https://img.shields.io/badge/Solidity-%5E0.8.x-blue)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Foundry Tests](https://img.shields.io/badge/Tested%20with-Foundry-red)](https://book.getfoundry.sh/)

A Solidity library for secure, on-chain timelock encryption and decryption, powered by the [dcipher threshold network](https://dcipher.network/). It enables smart contracts to unlock sensitive data based on predefined conditions.

## ✨ Overview

Controlling access to data based on time (and other conditions, e.g., contract events) is crucial for various use cases, such as auctions, voting, and content release schedules. `blocklock-solidity` provides developers with tools to implement conditional encryption on-chain, ensuring that encrypted data can only be decrypted after a specified condition has been met, thus enhancing security and fairness in for example, time-sensitive operations. 

This conditional encryption library is powered by the dcipher threshold network using **BLS pairing-based signature scheme** and **identity-based encryption** to achieve data encryption toward a condition without relying on a trusted third party.

The library is designed with modularity and simplicity in mind, allowing developers to easily integrate it into their existing smart contract projects to achieve conditional encryption on-chain for a wide range of applications, e.g., timelock encryption based on a predefined future chain height.

### Features
* Conditional Encryption: Encrypt data that can only be decrypted after a specified condition has been met, e.g., chain height.
* Decryption Callback: Implement custom logic that gets triggered when the decryption key is received, i.e., decryption of the Ciphertext.
* Abstract Interface: Extend and implement the library to suit your specific needs.

### Installation

#### Hardhat (npm)

```sh
npm install blocklock-solidity
```

#### Foundry 
```sh
forge install randa-mu/blocklock-solidity
```

### Usage 

#### Build
```sh
npm run build
```

#### Test
```sh
npm run test
```


### Supported Networks

For a list of supported networks and smart contract addresses, please see the [project documentation website](https://docs.dcipher.network/category/networks).


### Using the Solidity Interface


#### 1. Importing the Interface

To use this abstract contract in your project, the first step is to import the required files into your contract and use the proxy contract address for BlocklockSender in the constructor as the blocklockContract parameter:

```solidity
// Import the Types library for managing ciphertexts
import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
// Import the AbstractBlocklockReceiver for handling blocklock decryption & callbacks
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";
```

#### 2. Extend the AbstractBlocklockReceiver contract
Your contract must inherit from `AbstractBlocklockReceiver` and initialize with the deployed `BlocklockSender (Proxy)` contract from your desired network in the constructor. `AbstractBlocklockReceiver` can also be customised.

For a full example contract, please see [MockBlocklockReceiver.sol](src/mocks/MockBlocklockReceiver.sol) in the `src/mocks` folder. It inherits from the [AbstractBlocklockReceiver](src/AbstractBlocklockReceiver.sol) base contract.

The contract makes conditional encryption requests using the Ciphertext representing a `uint256` variable.

There are two options for funding conditional encryption requests, including: 
1. Direct funding, and
2. Subscription account


##### Direct Funding 

The following internal function allows the smart contract to make requests without an active subscription. 

```solidity
/// @notice Requests a blocklock without a subscription and returns the request ID and request price.
/// @dev This function calls the `requestBlocklock` function from the `blocklock` contract, passing the required parameters such as
///      `callbackGasLimit`, `condition`, and `ciphertext`.
/// @param callbackGasLimit The gas limit for the callback function to be executed after the blocklock request.
/// @param condition The condition for decryption of the Ciphertext encoded as bytes.
/// @param ciphertext The ciphertext to be used in the blocklock request.
/// @notice This function internally calls the `blocklock.requestBlocklock` function.
function _requestBlocklockPayInNative(
    uint32 callbackGasLimit,
    bytes memory condition,
    TypesLib.Ciphertext calldata ciphertext
) internal returns (uint256 requestId, uint256 requestPrice) {
    requestPrice = blocklock.calculateRequestPriceNative(callbackGasLimit);

    require(msg.value >= requestPrice, "Insufficient ETH");

    requestId = blocklock.requestBlocklock{value: msg.value}(callbackGasLimit, condition, ciphertext);
}
```
The function returns the request id and request price in wei.

Please note that to make a request via this function, the smart contract should be pre-funded with native tokens / ETH enough to fund the request price.

To fund the contract, the following function can be used (also inherited from [AbstractBlocklockReceiver.sol](src/AbstractBlocklockReceiver.sol)):

```solidity
/// @notice Function to fund the contract with native tokens for direct funding requests.
function fundContractNative() external payable {
    require(msg.value > 0, "You must send some ETH");
    emit Funded(msg.sender, msg.value);
}
```

The contract can be funded by anyone and can also be funded via direct native token / Ether transfer to its address.

To determine the request price prior to the request, the following function in the `BlocklockSender` contract interface can be used to fetch an estimated price:

```solidity
/// @notice Calculates the estimated price in native tokens for a request based on the provided gas limit
/// @param _callbackGasLimit The gas limit for the callback execution
/// @return The estimated request price in native token (e.g., ETH)
function calculateRequestPriceNative(uint32 _callbackGasLimit) external view returns (uint256);
```


##### Subscription Account 

To create requests with a subscription account, the subscription account should be created and pre-funded to cover for requests. A subscription account or id can be shared with multiple decryption key `receiver` smart contracts as well.

To create a subscription, the following function in [AbstractBlocklockReceiver.sol](src/AbstractBlocklockReceiver.sol) is used:

```solidity
/// @notice Creates and funds a new Randamu subscription using native currency.
/// @dev Only callable by the contract owner. If a subscription already exists, it will not be recreated.
/// @dev The ETH value sent in the transaction (`msg.value`) will be used to fund the subscription.
function createSubscriptionAndFundNative() external payable onlyOwner {
    subscriptionId = _subscribe();
    blocklock.fundSubscriptionWithNative{value: msg.value}(subscriptionId);
}
```

It sets the `subscriptionId` variable in the contract which is used to make subscription funded requests when the function below is called:

```solidity
/// @notice Requests a blocklock with a subscription and returns the request ID.
/// @dev This function calls the `requestBlocklockWithSubscription` function from the `blocklock` contract, passing the required parameters such as
///      `callbackGasLimit`, `subscriptionId`, `condition`, and `ciphertext`.
/// @param callbackGasLimit The gas limit for the callback function to be executed after the blocklock request.
/// @param condition The condition for decryption of the Ciphertext encoded as bytes.
/// @param ciphertext The ciphertext to be used in the blocklock request.
/// @return requestId The unique identifier for the blocklock request.
/// @notice This function internally calls the `blocklock.requestBlocklockWithSubscription` function.
function _requestBlocklockWithSubscription(
    uint32 callbackGasLimit,
    bytes condition,
    TypesLib.Ciphertext calldata ciphertext
) internal returns (uint256 requestId) {
    return blocklock.requestBlocklockWithSubscription(callbackGasLimit, subscriptionId, condition, ciphertext);
}
```


###### Sharing Subscription Accounts 

To share a subscription account, the smart contract that owns the subscription needs to call the `updateSubscription` function to approve other contracts to use it's created subscription id.

```solidity
/// @notice Adds a list of consumer addresses to the Randamu subscription.
/// @dev Requires the subscription ID to be set before calling.
/// @param consumers An array of addresses to be added as authorized consumers.
function updateSubscription(address[] calldata consumers) external onlyOwner {
    require(subscriptionId != 0, "subID not set");
    for (uint256 i = 0; i < consumers.length; i++) {
        blocklock.addConsumer(subscriptionId, consumers[i]);
    }
```

After calling `updateSubscription` all approved contracts can then call the `setSubId` function and start making subscription funded conditional encryption requests using the shared subscription account. 

```solidity
/// @notice Sets the Randamu subscription ID used for conditional encryption oracle services.
/// @dev Only callable by the contract owner.
/// @param subId The new subscription ID to be set.
function setSubId(uint256 subId) external onlyOwner {
    subscriptionId = subId;
    emit NewSubscriptionId(subId);
}
```

Please note that all approved contracts must also implement [AbstractBlocklockReceiver.sol](src/AbstractBlocklockReceiver.sol).

#### 3. Deploy the `BlocklockReceiver` contract
Before deploying, please verify that your target network is listed in the Supported Networks section. All contracts that initiate requests must be initialized with the appropriate deployed **BlocklockSender (Proxy)** specific to their host network.

Example Foundry Script for Filecoin Calibration Testnet deployment: 
```solidity
address blocklockSenderProxy = 0xF8e2477647Ee6e33CaD4C915DaDc030b74AB976b;
MockBlocklockReceiver mockBlocklockReceiver = new MockBlocklockReceiver(address(blocklockSenderProxy));
console.log("\nMockBlocklockReceiver deployed at: ", address(mockBlocklockReceiver));
```

To view a full example, please check the following links:
- Example solidity contract for creating conditional encryption requests and receiving decryption keys via callbacks - [MockBlocklockReceiver.sol](./src/mocks/MockBlocklockReceiver.sol) 
- Example off-chain [data encoding and encryption](https://github.com/randa-mu/blocklock-js?tab=readme-ov-file#example-encrypting-a-uint256-4-eth-for-decryption-2-blocks-later).



#### How It Works

* Encryption: Use the off-chain TypeScript library ([blocklock-js](https://github.com/randa-mu/blocklock-js)) to generate the encrypted data (`TypesLib.Ciphertext`) with a threshold network public key. The following solidity types are supported by the TypeScript library - uint256, int256, address, string, bool, bytes32, bytes, uint256[], address[], and struct. An example can be found in the [blocklock-js](https://github.com/randa-mu/blocklock-js?tab=readme-ov-file#example-encrypting-a-uint256-4-eth-for-decryption-2-blocks-later) library.
* Conditional Encryption Request: Call the appropriate `requestBlocklock` function (depending on the request funding route as described above) with the callbackGasLimit, condition for decryption, and the encrypted data or Ciphertext.
* Decryption: After the specified condition has been met, a callback to your `receiveBlocklock` logic is triggered with the decryption key which can be used unlock the data in your smart contract.


## Licensing

This library is licensed under the MIT License which can be accessed [here](LICENSE).

## Contributing

Contributions are welcome! If you find a bug, have a feature request, or want to improve the code, feel free to open an issue or submit a pull request.

## Acknowledgments

Special thanks to the Filecoin Foundation for supporting the development of this library.



# randomness-js

A JavaScript/TypeScript SDK to request, verify, and derive randomness from [the dcipher network](https://dcipher.network/), supported by the [randomness-solidity](https://github.com/randa-mu/randomness-solidity) contract. 
## 🌍 Overview

This project provides a client-side SDK to request on-chain randomness from the supported blockchains by interacting with the `RandomnessSender` contract implemented in [`randomness-solidity`](https://github.com/randa-mu/randomness-solidity). It allows you to:

- Integrate with a deployed `RandomnessSender` smart contract
- Request and verify on-chain randomness from your dApp frontend/backend


### 🌐 Supported Networks

| Network              | Chain ID  | Supported | Randomness Contract |
|----------------------|-----------|-----------|-----------|
| Filecoin Calibration | 314159    | ✅         |[0x91c7774C7476F3832919adE7690467DF91bfd919](https://calibration.filfox.info/en/address/0x91c7774C7476F3832919adE7690467DF91bfd919) |
| Base Sepolia              | 84532         | ✅         | [0x455bfe4B1B4393b458d413E2B0778A95F9B84B82](https://sepolia.basescan.org/address/0x455bfe4B1B4393b458d413E2B0778A95F9B84B82) |
| Polygon PoS            | 137  | ✅         | [0x455bfe4B1B4393b458d413E2B0778A95F9B84B82](https://polygonscan.com/address/0x455bfe4B1B4393b458d413E2B0778A95F9B84B82) |

## 📦 Getting started

### Installation

Install the `randomness-js` library into your frontend project.
```bash
npm install randomness-js
# or
yarn add randomness-js
```

### Usage

#### Connect to the supported network
Create an instance of randomness for your preferred network.
```ts
import { Randomness } from "randomness-js"
import { JsonRpcProvider, Wallet } from "ethers"

// set up your ethers objects
const rpc = new JsonRpcProvider("https://api.calibration.node.glif.io/rpc/v1")
const wallet = new Wallet("<YOUR PRIVATE KEY HERE>", rpc)

// create randomness instance on Base Sepolia testnet
const randomness = Randomness.createBaseSepolia(wallet)
```
You can also create the randomness instance for your desired network using its chainId. Check the [supported networks](#-supported-networks) for details.
```ts
//create randomness instance using the chainID
const randomness = Randomness.createFromChainId(wallet, <SUPPORTED_CHAIN_ID>)
```

#### Request randomness

```ts
const response = await randomness.requestRandomness()
```

#### Verify randomness
The smart contracts verify the randomness anyway, but it doesn't hurt to verify it for yourself to be sure.
```ts
await randomness.verify(response)
```

You can avoid throwing errors on verification failure by passing config parameters like so:
```ts
const isVerified = await randomness.verify(response, { shouldBlowUp: false })
```

## 🛠 Development
Clone the repo
```bash
git clone https://github.com/randa-mu/randomness-js.git
cd randomness-js
git submodule update --init --recursive
```
Install the dependencies and build the projects to generate contract files.
```bash
npm install
npm run build
```

For running the tests, you need to create a `.env` file at the project root, filling in the fields detailed in [`.env.sample`](./.env.sample).
```bash
npm run test
```

## 🤝 Contributing

We welcome pull requests and issues. If you find a bug or want to request a feature, feel free to open an issue or PR!

## 📄 License

This project is licensed under the [MIT License](./LICENSE).



Randomness
The randomness-solidity library provides a minimal, plug-and-play interface for requesting secure, verifiable randomness from the dcipher network. It is ideal for evm-compatible smart contracts that require unpredictable randomness, such as raffles, games, randomized NFT drops, or fair selections.

The core of this library is a base contract, RandomnessReceiverBase, which abstracts away all low-level request/response logic using a threshold signature scheme from the dcipher network. Developers simply inherit from it and override a callback to use the random result.

🚀 This Quickstart Walks You Through:

Setting up a new Hardhat project
Installing the randomness-solidity & writing a basic randomness consumer contract
Deploying it to Base Sepolia with a known RandomnessSender
Requesting and consuming randomness
Interacting with the contract to retrieve the result
🧰 Prerequisites
Before you begin, ensure you have the following:

Node.js & npm
Basic familiarity with Solidity and smart contract development
1. Set Up a New Hardhat Project
mkdir my-randomness-app && cd my-randomness-app
npm init -y
npm install --save-dev hardhat
npx hardhat init

When prompted, choose “Create a TypeScript project” and follow the instructions to finish the init process.

note
💡 Hardhat provides a full Ethereum development environment and is one of the most widely used frameworks for writing, testing, and deploying smart contracts. Besides Hardhat, you can also choose other popular frameworks to create the smart contract project, such as Foundry.

2. Install the randomness-solidity Library
To extend the library from randomness-solidity, we first need to install the library into your project.

npm install randomness-solidity

This package includes the RandomnessReceiverBase contract and supporting utilities.

3. Create a Randomness Consumer Contract
Create a new solidity file under the /contract folder: /MyRandomConsumer.sol. This smart contract will inherit RandomnessReceiverBase and implement the logic to request and consume the randomness.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { RandomnessReceiverBase } from "randomness-solidity/src/RandomnessReceiverBase.sol";

contract MyRandomConsumer is RandomnessReceiverBase {
    uint256 public requestId;
    bytes32 public randomValue;

    event RandomnessRequested(uint256 indexed requestId);
    event RandomnessFulfilled(uint256 indexed requestId, bytes32 randomValue);
 
    constructor(address randomnessSender) RandomnessReceiverBase(randomnessSender) {}

    /// @notice Called by user to request randomness
    function getRandomness() external {
        requestId = requestRandomness();
        emit RandomnessRequested(requestId);
    }

    /// @notice Called by the randomnessSender to fulfill the request    
    function onRandomnessReceived(uint256 requestID, bytes32 _randomness) internal override {
        require(requestId == requestID, "Request ID mismatch");
        randomValue = _randomness;
        
        emit RandomnessFulfilled(requestID, _randomness);
        // You can add any logic to consume randomness value here.
    }
}

🧠 Explanation

Code	Purpose
RandomnessReceiverBase	Base contract handles the request/response logic with the randomness provider.
constructor(address sender)	Requires the deployed RandomnessSender contract address.
getRandomness()	Initiates the randomness request.
onRandomnessReceived(...)	Override this function with your project logic consuming randomness. It will be invoked automatically once the random value is received from the dcipher network.
4. Deploy the Contract
We will use Hardhat Ignition to manage smart contract deployments. Let’s create a file ignition/modules/MyRandomConsumer.ts with the following code to deploy MyRandomConsumer.

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const randomnessSenderAddress = "0xRandomnessSenderAddressOnBase";

const RandomnessModule = buildModule("RandomnessModule", (m) => {
  const lock = m.contract("MyRandomConsumer", [randomnessSenderAddress]);

  return { lock };
});

export default RandomnessModule;

Then we should the add desired network into hardhat.config.ts - in this example we are using Base Sepolia Testnet. Add your private key for the deployer wallet with test token funded. We advise using a .env file to manager your secrets to avoid leaking them.

module.exports = {
  solidity: "0.8.28",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org/",
      chainId: 84532,
      accounts: [PRIVATE_KEY]
    }
  }
}

Deploy using:

npx hardhat ignition deploy ./ignition/modules/MyRandomConsumer.ts --network baseSepolia

note
Use a network where RandomnessSender is deployed (e.g., Filecoin Calibration, Base, etc.). Check Networks page for deployed addresses.

5. Interact with the Contract
Once deployed:

Call getRandomness() on your contract.
The dcipher network monitors the chain for requests, generates the randomness with a threshold signature and calls back to the RandomnessSender contract.
The network delivers randomness to onRandomnessReceived().
🧪 A. Use Hardhat Console
npx hardhat console --network <your-network>

const consumerAddress = "0xContractAddressEncodedAsHex";
const MyRandomConsumer = await ethers.getContractFactory("MyRandomConsumer");
const consumer = await MyRandomConsumer.attach(consumerAddress);

// Request randomness
await consumer.getRandomness();

Wait ~1–2 minutes for fulfillment, then:

await consumer.randomValue();

✅ Example Output
> await consumer.requestRandomness()
// [Tx submitted]

> await consumer.randomValue()
// '0x0000000000000000000000000000000000000000000000000000000000000000'

...wait 1–2 minutes...

> await consumer.randomValue()
'0x9ec2573095983f37e7ed3d3cd73251e6cc6c44567dbcf231675ea22ccef8c898'

🧪 B. Use Frontend or Script
const consumer = new ethers.Contract(consumerAddress, consumerAbi, signer);
await consumer.getRandomness();

💡 The event emitted in onRandomnessReceived() can also be listened for via frontend code.

🧠 Summary
Step	Purpose
inherit RandomnessReceiverBase	Connect your contract to the randomness flow
Deploy with sender address	Must point to deployed RandomnessSender
Call getRandomness()	Kicks off a randomness request from randomnessSender
Override onRandomnessReceived()	Handle the randomness callback when fulfilled.
By following this quickstart, you've built a simple Solidity project that can securely request and consume verifiable randomness from the dcipher network using the randomness-solidity library. This foundational setup allows you to easily extend your contract logic, whether you're building games, lotteries, randomized NFT minting, or any application that requires verifiable randomness..


Blocklock Encryption
Conditional encryption is a powerful cryptographic technique that keeps data encrypted until specific conditions are met. The dcipher network's blocklock encryption implements this concept on-chain, allowing data to remain encrypted until predefined conditions are satisfied, which is a block number in this case. This encryption is crucial for many blockchain applications, from sealed-bid auctions to delayed-reveal NFTs.

While this quickstart focuses on blocklock, where the decryption condition is reaching a specific blockchain height (block number), that is only one type of conditional encryption. The dcipher network also supports various types of conditions, including:

Block height/number based conditions
Timestamp based conditions
Oracle-driven conditions
Multi-condition combinations
This quickstart shows you how to integrate blocklock encryption into your Solidity smart contracts using the blocklock-solidity and blocklock-js libraries.

🚀 This Quickstart Walks You Through:

Setting up a new Hardhat project
Installing the blocklock-solidity & blocklock-js libraries
Writing a customized receiver contract to handle blocklock decryption requests
Deploying to Base Sepolia with pre-deployed blocklockSender contract
Simulating an encrypted payload with block height condition
🧰 Prerequisites
Before you begin, ensure you have the following:

Development Environment

Node.js (v16 or later)
npm (v7 or later)
Blockchain Tools

A wallet with test ETH (for Base Sepolia)
Basic knowledge of Solidity and smart contracts
Familiarity with Hardhat or similar development frameworks
Network Requirements

Access to the Base Sepolia RPC endpoint
Test ETH for deployment and testing
1. Set Up a New Hardhat Project
mkdir my-blocklock-app && cd my-blocklock-app
npm init -y
npm install --save-dev hardhat
npx hardhat init

Choose "Create a TypeScript project" when prompted and follow the instructions to finish the init process.

💡 Note: Besides Hardhat, you can also choose other popular frameworks to create the smart contract project, such as Foundry.

2. Install the blocklock-solidity Library
To extend the blocklock functions, we need to first install blocklock-solidity library into your project.

npm install blocklock-solidity

Then we can build a smart contract to extend the AbstractBlocklockReceiver contract and use supporting utilities.

3. Create a BlocklockReceiver Contract
In this step, you'll create a Solidity contract that implements the functions to request the blocklock encryption and receive the callback from the dcipher network. We'll start by creating a new file: contracts/MyBlocklockReceiver.sol.

This contract must import the necessary types and inherit from the AbstractBlocklockReceiver from blocklock-solidity library. The constructor takes the address of a deployed BlocklockSender(Proxy) contract, which serves as the entry point for registering encrypted payloads and triggering blocklock decryption. Check Networks page for supported chains and corresponding contract addresses.

Funding models

The dcipher network supports two ways to pay for blocklock encryption and decryption services:

Direct Funding: Users send native tokens (e.g. ETH) directly when making a blocklock encryption request.
Subscription Account: A pre-funded account balance is used to cover multiple requests over time.
In this example, we'll use direct funding for simplicity. This means the user must send native tokens along with the blocklock encryption request to cover callback gas fee when the decryption key is delivered. You can also customize the payment in createTimelockRequestWithDirectFunding for calling _requestBlocklockPayInNative.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract MyBlocklockReceiver is AbstractBlocklockReceiver {
    uint256 public requestId;
    TypesLib.Ciphertext public encryptedValue;
    uint256 public decryptedValue;

    constructor(address blocklockSender) AbstractBlocklockReceiver(blocklockSender) {}

    function createTimelockRequestWithDirectFunding(
        uint32 callbackGasLimit,
        bytes calldata condition,
        TypesLib.Ciphertext calldata encryptedData
    ) external payable returns (uint256, uint256) {
        // create timelock request
        (uint256 _requestId, uint256 requestPrice) =
            _requestBlocklockPayInNative(callbackGasLimit, condition, encryptedData);
        // store request id
        requestId = _requestId;
        // store Ciphertext
        encryptedValue = encryptedData;
        return (requestId, requestPrice);
    }

    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        require(requestId == _requestId, "Invalid request id.");
        // decrypt stored Ciphertext with decryption key
        decryptedValue = abi.decode(_decrypt(encryptedValue, decryptionKey), (uint256));
        // Placeholder for builders to add any logic to consume the decrypted data in smart contract.
    }
}


🧠 Explanation

Code	Purpose
AbstractBlocklockReceiver	Base contract from the blocklock-solidity library that handles the blocklock request from the dcipher network.
constructor(address blocklockSender)	Initializes the receiver contract and links it to the deployed BlocklockSender(Proxy) contract on the target network.
createTimelockRequestWithDirectFunding(...)	Override this function to register a new blocklock encryption request using direct funding. This must be payble function.
_onBlocklockReceived(...)	Override this function with your project logic consuming blocklock. It will be invoked automatically by the dcipher network when the decryption key becomes available after the condition is met.
4. Deploy the Contract
We will use Hardhat Ignition to manage smart contract deployments. Let's create a file ignition/modules/MyBlocklockReceiver.ts with the following code to deploy MyBlocklockReceiver.

💡 Note: Use a network where BlocklockSender is deployed (e.g, Base Sepolia, Filecoin Calibration, Polygon, etc.). Check the Networks page for the deployed BlockLockSender contract address. In this quickstart, we have used the Base Sepolia deployed contract.

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEFAULT_SENDER = "0xBlockLockSenderAddressOnBase";

const BlockLockModule = buildModule("BlockLockModule", (m) => {
    // Get the sender parameter with a default value
    const blocklockSenderAddress = m.getParameter("sender", DEFAULT_SENDER);
    const blockReceiver = m.contract("MyBlocklockReceiver", [blocklockSenderAddress]);

    return { blockReceiver };
});

export default BlockLockModule;


Now, let's add the desired network to hardhat.config.ts, we are using Base Sepolia as an example here.

module.exports = {
  solidity: "0.8.28",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org/",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
}

Add your private key for the deployer wallet with test tokens funded. You can get Base Sepolia test tokens from these faucets.

Create a new .env file, as shown below, to manage your secrets and prevent them from being leaked.

# Network RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Private Key (without 0x prefix)
PRIVATE_KEY=13c2fb33d069aece5f674ec27ef9077104397f04c6393ef5159c6ac3ca7a6a41

Deploy using:

npx hardhat ignition deploy ./ignition/modules/MyBlocklockReceiver.ts --network baseSepolia --parameters '{"sender":"0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e"}'


5. Simulate a Blocklock Request
In practice, the data encryption is done off-chain using blocklock-js. So, let's install the JS library to your project.

npm install blocklock-js

For the purpose of quickstart, we will create a script to simulate the blocklock encryption request.

Connect to your deployed MyBlocklockReceiver contract
Prepare the blocklock encryption payload, including blockHeight, encrypted message, callBack gaslimt and price, etc.
Call the myBlocklockReceiver contract to request blocklock encryption with direct funding.
Let's create a scripts\requestBlocklock.ts with the following code, and update 0xMyBlocklockReceiverContractAddress with the Blocklock Receiver Contract Address you just deployed.

import { ethers } from "hardhat";
import { getBytes, Signer } from "ethers";
import { Blocklock, encodeCiphertextToSolidity, encodeCondition, encodeParams } from "blocklock-js";
import { MyBlocklockReceiver } from "../typechain-types";

async function main() {
    // Get the signer from hardhat config
    const [signer] = await ethers.getSigners();

    // 1. Connect to the deployed myBlocklockReceiver contract
    const contractAddress = '0xMyBlocklockReceiverContractAddress';
    const ContractFactory = await ethers.getContractFactory("MyBlocklockReceiver");
    const contract = ContractFactory.connect(signer).attach(contractAddress) as MyBlocklockReceiver;

	// 2. Create blocklock request payload
    // Set block height for blocklock decryption (current block + 10)
    const blockHeight = BigInt(await ethers.provider.getBlockNumber() + 10);
    const conditionBytes = encodeCondition(blockHeight);

    // Set the message to encrypt
    const msg = ethers.parseEther("8"); // Example: BigInt for blocklock ETH transfer
    const msgBytes = encodeParams(["uint256"], [msg]);
    const encodedMessage = getBytes(msgBytes);

    // Encrypt the encoded message usng Blocklock.js library
    const blocklockjs = Blocklock.createBaseSepolia(signer as unknown as Signer);
    const cipherMessage = blocklockjs.encrypt(encodedMessage, blockHeight);

    // Set the callback gas limit and price
    // Best practice is to estimate the callback gas limit e.g., by extracting gas reports from Solidity tests
    const callbackGasLimit = 700_000n;
    // Based on the callbackGasLimit, we can estimate the request price by calling BlocklockSender
    // Note: Add a buffer to the estimated request price to cover for fluctuating gas prices between blocks
    const [requestCallBackPrice] = await blocklockjs.calculateRequestPriceNative(callbackGasLimit)

    console.log("Target block for unlock:", blockHeight);
    console.log("Callback gas limit:", callbackGasLimit);
    console.log("Request CallBack price:", ethers.formatEther(requestCallBackPrice), "ETH");
    
    //Ensure wallet has enought token to cover the callback fee
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");
    if (balance < requestCallBackPrice) {
        throw new Error(`Insufficient balance. Need ${ethers.formatEther(requestCallBackPrice)} ETH but have ${ethers.formatEther(balance)} ETH`);
    }

    // 3. Invoke myBlocklockReceiver contract to request blocklock encryption with direct funding.
    console.log("Sending transaction...");
    const tx = await contract.createTimelockRequestWithDirectFunding(
        callbackGasLimit,
        conditionBytes,
        encodeCiphertextToSolidity(cipherMessage),
        { value: requestCallBackPrice }
    );
    
    console.log("Transaction sent, waiting for confirmation...");
    const receipt = await tx.wait(1);
    if (!receipt) {
        throw new Error("Transaction failed");
    }
    console.log("BlockLock requested in tx:", receipt.hash);
}

main().catch((err) => {
  console.error("Invocation failed:", err);
  process.exitCode = 1;
});


Run the script with:

npx hardhat run scripts/requestBlocklock.ts

💡 Note: Best Practice is to estimate callback gas limit and request price dynamically based on calldata size and network. You can implement gas estimation based on your contract and network, rather than being hardcoded. For instance, using the Hardhat gas reporter.

📌 What Happens Next?
Once the request is submitted:

The MyBlocklockReceiver contract stores your encrypted payload and tracks the request ID.
The dcipher network monitors the chain. Once the target block height is reached, it will deliver the decryption key by calling the _onBlocklockReceived() callback in your contract.
Your contract will then decrypt the payload and store or act on the decrypted result.
To simulate the blocklock request and send the transaction to your contract, use the following Hardhat command. Ensure you have sufficient test token balance in your wallet:

npx hardhat run scripts/requestBlocklock.ts --network baseSepolia

# Output example
Current block: 26387874
Target block for unlock: 26387884n
Callback gas limit: 700000n
Request CallBack price: 0.003 ETH
Wallet balance: 0.033797044091982776 ETH
Sending transaction...
Transaction sent, waiting for confirmation...
BlockLock requested in tx: 0xe64958da7f81498891f5f5665caecee758dfa301c24a999823195ec932ef90ef

6. Check the Blocklock Request
Once you've successfully submitted a blocklock request, the hard part is done — now it's time to wait for the unlock condition to be met.

In our example, the condition is a block height set 10 blocks into the future. Once the blockchain reaches or exceeds that height, the dcipher network will automatically:

Generate the required decryption key
Call back into your smart contract via _onBlocklockReceived(...)
Deliver the decryption key to your contract
Trigger decryption and the blocklock encrypted value will be available on-chain
Let's also create scripts\getDecryptedValue.ts to check the decrypted value in your smart contract. Make sure you use the contract address you just deployed.

import { ethers } from "hardhat";
import { MyBlocklockReceiver } from "../typechain-types";

async function main() {
    // Get the signer from hardhat config
    const [signer] = await ethers.getSigners();

    const contractAddress = '0xMyBlocklockReceiverContractAddress';
    const ContractFactory = await ethers.getContractFactory("MyBlocklockReceiver");
    const contract = ContractFactory.connect(signer).attach(contractAddress) as MyBlocklockReceiver;

    const plainTextValue = await contract.decryptedValue();
    console.log("Unlocked value:", plainTextValue);
}

main().catch((err) => {
  console.error("Invocation failed:", err);
  process.exitCode = 1;
});


After the blocklock condition is met, let's run the script to check the decrypted value in your smart contract.

npx hardhat run scripts/getDecryptedValue.ts --network baseSepolia

# Output example
Unlocked value: 15000000000000000000n

🧠 Summary
By following this quickstart, we've built a complete hardhat project using the blocklock encryption from the dcipher network using both blocklock-solidity and blocklock-js libraries.

This setup provides a solid foundation to build more complex features, including encrypted auctions, sealed bids, private on-chain voting, delayed asset unlocks, and more. You can extend your contracts with richer logic, build a frontend for monitoring requests, or implement off-chain services to coordinate encrypted interactions at scale.

👉 Next steps:

Try different types of encrypted payloads (e.g., strings, addresses, structs)
Add support for subscription-based funding
Emit events for external monitoring or analytics
Explore advanced blocklock-js usage such as custom condition encoders.