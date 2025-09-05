API reference
We provide libraries in multiple languages for verifying and deriving random numbers from our network, as well as performing common gaming tasks for randomness that are easy to get wrong.

Installation
Rust
Solidity
Typescript
You can install the library by running:

npm install @randamu/randomness-js

It comes with Typescript types included.

Pick a random integer
Rust
Solidity
Typescript
import { KeccakRng } from "@randamu/randomness

// Fetch the randomness from chain using ethers.js or similar
const randomness: Uint8Array = .. ;

// Initialize the SDK using Keccak for derivation (for compatibility with EVM smart contracts)
// Other hash functions and XOF are available.
const rng = new KeccakRng(randomness)

// Now we get the same random number as every other SDK user, conveniently turned into a javascript number
const randomInt: number = rng.nextUint8()

// Note: bigger bitsizes will have different return types
const randomBigInt: bigint = rng.nextUint64()


Installation
Rust
Solidity
Typescript
We recommend using forge to manage your dependencies. Then run:

forge install randa-mu/randomness-solidity

Pick a random integer
Rust
Solidity
Typescript
import { nextUint8 } from "../lib/RNGFromBytes.sol"

// We get our random bytes from a callback or somewhere else
bytes memory randomness = .. ;

// Now we get the same random number as every other SDK user
uint8 randomValue = nextUint8(randomness);

// Other bitsizes are support by similar methods
uint32 randomValue = nextUint32(randomness);


Conditional Encryption
Introduction
Conditional encryption is a cryptographic technique where encrypted data can only be decrypted if specific, pre-defined conditions are met. Instead of giving anyone with a decryption key access to the data, access is programmatically controlled based on logic or real-world states—such as:

A future timestamp
A future block number
A change in on-chain contract state
An off-chain event or data from an Oracle
Blocklock encryption is the most commonly known and used case: a user encrypts data that can only be decrypted after a specified block height on any supported blockchain. This is ideal for:

Sealed-bid auctions
MEV-resistant transaction submission
Time-delayed secrets or transfers
Voting and quizzes
The primary reference implementation is blocklock-solidity, which enables developers to use threshold decryption across chains.

How It Works
Conditional encryption in dcipher uses a combination of threshold BLS signatures and identity-based encryption (IBE) to create a secure conditional lock mechanism. The system operates through a committee of operator nodes that collectively manage the decryption process:

When data is encrypted, it is locked with a condition (e.g., a future block height)
The committee nodes monitor the blockchain for the specified condition
Once the condition is met, the committee collectively generates a threshold signature attesting to the event
This signature serves as the decryption key, allowing any party to decrypt the data
The key innovation is that the decryption key is not pre-determined or stored anywhere. Instead, it is generated on-demand by the committee only after they have verified and attested to the condition being met. This approach removes the need for trusted intermediaries or continual off-chain monitoring. It enables secure workflows where data remains locked until the right moment — ideal for use cases like sealed-bid auctions, timed content releases, or conditional asset transfers.

Comparing Encryption Models
Feature	Conditional Encryption (dcipher)	Traditional Encryption	Homomorphic Encryption
Condition-based Access	✅	❌	❌
Third-party-free	✅	❌(key exchange required)	✅
Cross-chain Ready	✅	⚠️ (with bridges)	❌
Computational Overhead	Low	Low	Low
Offline Decryption	✅	✅	✅
Aside from the technical differences in the table above, there are key differences in the purpose of each kind of encryption:

dcipher gives you conditional access — data stays locked until a condition is met.
Homomorphic encryption enables computation over encrypted data — data can be transformed without ever being decrypted.
Traditional encryption ensures only the key holder can read the data.
Security Assumptions
dcipher's conditional encryption relies on the following assumptions:

Honest Majority Assumption: As long as fewer than the agreed m-of-n threshold of nodes are malicious for a given committee, future decryption keys (e.g., for a given round) remain unknown until the condition is met.
Computational Diffie-Hellman Assumption: The current cryptography (e.g, BLS and IBE) and elliptic curve cryptography are not quantum-resistant.
Availability Guarantee: If all nodes in the network or your chosen committee shut down, undecrypted ciphertexts will be permanently locked unless broken by a future quantum adversary.
In practice, these assumptions are mitigated by a robust validator set, crypto-economic incentives for honest behaviour of the operator nodes and proactive monitoring of network performance.


Randomness
dcipher's Verifiable Randomness Services are available across multiple blockchain networks, including production mainnets and testnets for development and testing.

Mainnet Networks
Network	Chain ID	RandomnessSender Proxy Contract
Filecoin	314	0xDD6FdE56432Cd3c868FEC7F1430F741967Fb0de8
Polygon	137	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779
Testnet Networks
Network	Chain ID	RandomnessSender Proxy Contract
Filecoin Calibration	314159	0x94C5774DEa83a921244BF362a98c12A5aAD18c87
Base Sepolia	84532	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779
Arbitrum Sepolia	421614	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779
Optimism Sepolia	11155420	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779
Avalanche C-Chain	43113	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779
Sei	713715	0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779



Blocklock Encryption
dcipher's Conditional Encryption (Blocklock) services are available across multiple blockchain networks, including production mainnets and testnets for development and testing.

Mainnet Networks
Network	Chain ID	BlocklockSender Proxy Contract
Filecoin	314	0x34092470CC59A097d770523931E3bC179370B44b
Polygon	137	0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e
Testnet Networks
Network	Chain ID	BlocklockSender Proxy Contract
Filecoin Calibration	314159	0xF00aB3B64c81b6Ce51f8220EB2bFaa2D469cf702
Base Sepolia	84532	0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e
Arbitrum Sepolia	421614	0xd22302849a87d5B00f13e504581BC086300DA080
Optimism Sepolia	11155420	0xd22302849a87d5B00f13e504581BC086300DA080
Avalanche C-Chain	43113	0xd22302849a87d5B00f13e504581BC086300DA080
Sei	713715	0xd22302849a87d5B00f13e504581BC086300DA080



sample randomness usage:
'use client';
import React, { useState } from 'react';
import Image from "next/image";
import { Randomness } from 'randomness-js'
import { ethers, getBytes } from 'ethers'
import { useAccount, useReadContract, useWriteContract, useConfig } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/app/config';
import { waitForTransactionReceipt } from "@wagmi/core";
import Header from './header';
import Wallet from '../wallet';

export default function CoinFlip() {

    const { isConnected } = useAccount();
    const [result, setResult] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Read function that doesn't need args
    const { data: readData } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'randomness',
    }) as { data: bigint | undefined };

    // Write function setup
    const { writeContract } = useWriteContract();
    const config = useConfig();

    const handleTransactionSubmitted = async (txHash: string) => {
        const transactionReceipt = await waitForTransactionReceipt(config, {
            hash: txHash as `0x${string}`,
        });

        if (transactionReceipt.status === "success") {
            // execute your logic here
            const bytes = getBytes(readData?.toString() || '0');
            console.log(readData, "Read Data")
            if (bytes.length === 0) {
                setError("Failed to generate random number. Please try again.");
                return
            }
            console.log("Randomness bytes:", bytes)

            setResult(bytes[0] % 2 === 0 ? 1 : 2)

        }
    };

    const generateRandomNumber = async () => {
        try {
            setResult(0); // Reset result to show loading state
            setError(null); // Clear any previous errors
            try {
                const callbackGasLimit = 700_000;
                const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);

                const randomness = Randomness.createBaseSepolia(jsonProvider)
                console.log("Randomness : ", randomness)
                const [requestCallBackPrice] = await randomness.calculateRequestPriceNative(BigInt(callbackGasLimit))

                writeContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'generateWithDirectFunding',
                    args: [callbackGasLimit],
                    value: requestCallBackPrice,
                },
                    {
                        onSuccess: handleTransactionSubmitted,
                    });

            } catch (error) {
                console.error('Transfer failed:', error);
            }


        } catch (error) {
            console.error("Error in generateRandomNumber:", error)
            setError("Failed to generate random number. Please try again.");
        }
    }

    return (

        <>
            {isConnected ? <>
                <Header />
                <div className="min-h-screen bg-black-pattern flex flex-col relative">
                    <main className="flex-grow mt-8">
                        <div className="container mx-auto px-4 py-12">
                            {error && (
                                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col lg:flex-row items-center lg:gap-64">
                                {/* Left Side - Text Content */}
                                <div className="w-full lg:w-1/2 space-y-8 text-wrap mt-24">
                                    <h1 className="font-funnel-display text-3xl md:text-4xl font-bold text-white">
                                        Heads or Tails? What&apos;s you call?
                                    </h1>
                                    <p className="font-funnel-display text-lg text-gray-500 font-funnel">
                                        Each coin flip uses a verifiable random number generated by a secure network of trusted nodes.
                                        It&apos;s cryptographically safe, tamperproof, and aligned with blockchain standards, so the result is always fair and provable.
                                    </p>

                                    <div>
                                        <button
                                            onClick={generateRandomNumber}
                                            className="font-funnel-display flex flex-row gap-2 text-red-500 text-2xl font-medium py-3 transition duration-300 transform hover:scale-105">
                                            <Image
                                                src="/assets/images/redarrow.svg"
                                                alt="Description"
                                                width={30}
                                                height={30}
                                                className=""
                                            />
                                            Spin The Coin
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side - Graphic Area */}
                                <div className="w-full lg:w-1/2 justify-center items-center">
                                    <div className="w-full aspect-square max-w-md flex items-center justify-center">
                                        {result == 0 &&
                                            <Image
                                                src="/assets/images/question.png"
                                                alt="Description"
                                                width={400}
                                                height={400}
                                                className="animate-pulse"
                                            />
                                        }
                                        {result == 1 &&
                                            <Image
                                                src="/assets/images/heads.png"
                                                alt="Description"
                                                width={400}
                                                height={400}
                                                className=""
                                            />
                                        }
                                        {result == 2 &&
                                            <Image
                                                src="/assets/images/tails.png"
                                                alt="Description"
                                                width={400}
                                                height={400}
                                                className=""
                                            />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </> : <>
                <Wallet />
            </>}
        </>

    );
}


solidity contract:
/// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {RandomnessReceiverBase} from "randomness-solidity/src/RandomnessReceiverBase.sol";

/// @title MockRandomnessReceiver contract
/// @author Randamu
/// @notice A contract that requests and consumes randomness
contract MockRandomnessReceiver is RandomnessReceiverBase {
    /// @notice Stores the latest received randomness value
    bytes32 public randomness;

    /// @notice Stores the request ID of the latest randomness request
    uint256 public requestId;

    /// @notice Initializes the contract with the address of the randomness sender
    /// @param randomnessSender The address of the randomness provider
    constructor(address randomnessSender, address owner) RandomnessReceiverBase(randomnessSender, owner) {}

    /// @notice Requests randomness using the direct funding option
    /// @dev Calls `_requestRandomnessPayInNative` to get a random value, updating `requestId` with the request ID
    function generateWithDirectFunding(uint32 callbackGasLimit) external payable returns (uint256, uint256) {
        // create randomness request
        (uint256 requestID, uint256 requestPrice) = _requestRandomnessPayInNative(callbackGasLimit);
        // store request id
        requestId = requestID;
        return (requestID, requestPrice);
    }

    /// @notice Requests randomness using the subscription option
    /// @dev Calls `_requestRandomnessWithSubscription` to get a random value, updating `requestId` with the request ID
    function generateWithSubscription(uint32 callbackGasLimit) external returns (uint256) {
        // create randomness request
        uint256 requestID = _requestRandomnessWithSubscription(callbackGasLimit);
        // store request id
        requestId = requestID;
        return requestID;
    }

    function cancelSubscription(address to) external onlyOwner {
        _cancelSubscription(to);
    }

    /// @notice Callback function that processes received randomness
    /// @dev Ensures the received request ID matches the stored one before updating state
    /// @param requestID The ID of the randomness request
    /// @param _randomness The random value received from the oracle
    function onRandomnessReceived(uint256 requestID, bytes32 _randomness) internal override {
        require(requestId == requestID, "Request ID mismatch");
        randomness = _randomness;
    }
}