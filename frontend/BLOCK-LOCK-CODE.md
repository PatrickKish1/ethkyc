import { ethers, getBytes, id } from "ethers";
import {
  Blocklock,
  encodeCiphertextToSolidity,
  encodeCondition,
} from "blocklock-js";
import { useMutation } from "@tanstack/react-query";
import { useEthersProvider, useEthersSigner } from "@/hooks/useEthers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { BLOCKLOCK_CONTRACT_ABI, CONTRACT_ABI } from "@/lib/contract";
import { useNetworkConfig } from "./useNetworkConfig";

export const useEncrypt = () => {
  const [activeTab, setActiveTab] = useState("text");
  const [userMessage, setUserMessage] = useState("");
  const [blocksAhead, setBlocksAhead] = useState("");
  const [estimatedDecryptionTime, setEstimatedDecryptionTime] = useState("");
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const { chainId } = useAccount();
  const { CONTRACT_ADDRESS, secondsPerBlock, gasConfig } = useNetworkConfig();

  useEffect(() => {
    const updateEstimate = async () => {
      try {
        if (!provider || !secondsPerBlock || !blocksAhead) {
          setEstimatedDecryptionTime("");
          return;
        }
        const currentBlock = await provider.getBlockNumber();
        const currentBlockData = await provider.getBlock(currentBlock);
        const currentTimestamp =
          currentBlockData?.timestamp || Math.floor(Date.now() / 1000);

        const blocks = Number(blocksAhead);
        if (Number.isNaN(blocks) || blocks <= 0) {
          setEstimatedDecryptionTime("");
          return;
        }

        const targetTimestamp = currentTimestamp + blocks * secondsPerBlock;
        const diffSeconds = Math.max(0, targetTimestamp - currentTimestamp);

        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = Math.floor(diffSeconds % 60);

        const parts: string[] = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        if (seconds || parts.length === 0) parts.push(`${seconds}s`);

        const absolute = new Date(targetTimestamp * 1000).toLocaleString();
        setEstimatedDecryptionTime(`in ~${parts.join(" ")} (≈ ${absolute})`);
      } catch {
        setEstimatedDecryptionTime("");
      }
    };

    updateEstimate();
  }, [provider, secondsPerBlock, blocksAhead]);
  const handleEncrypt = useMutation({
    mutationFn: async ({
      userMessage,
      blocksAhead,
    }: {
      userMessage: string;
      blocksAhead: string;
    }) => {
      if (!signer || !provider || !chainId) {
        throw new Error("Please connect your wallet");
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Calculate target block height based on blocks ahead
      const currentBlock = await provider.getBlockNumber();

      const blocksToAdd = Number(blocksAhead);
      if (Number.isNaN(blocksToAdd) || blocksToAdd <= 0) {
        throw new Error("Please enter a valid number of blocks ahead");
      }

      const blockHeight = BigInt(currentBlock + blocksToAdd);
      console.log(
        `Current block: ${currentBlock}, Target block: ${blockHeight.toString()}`
      );

      // Set the message to encrypt
      const msgBytes = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        [userMessage]
      );
      const encodedMessage = getBytes(msgBytes);
      console.log("Encoded message:", encodedMessage);

      // Encrypt the encoded message usng Blocklock.js library
      const blocklockjs = Blocklock.createFromChainId(signer, chainId);
      const cipherMessage = blocklockjs.encrypt(encodedMessage, blockHeight);
      console.log("Ciphertext:", cipherMessage);

      const callbackGasLimit = gasConfig.callbackGasLimitDefault;

      const feeData = await provider.getFeeData();

      if (!feeData.maxFeePerGas) {
        throw new Error("No fee data found");
      }

      const blocklockContract = new ethers.Contract(
        gasConfig.blocklockAddress,
        BLOCKLOCK_CONTRACT_ABI,
        signer
      );

      const requestPrice = (await blocklockContract.estimateRequestPriceNative(
        callbackGasLimit,
        feeData.maxFeePerGas
      )) as bigint;

      const requestCallBackPrice =
        requestPrice +
        (requestPrice * BigInt(gasConfig.gasBufferPercent)) / BigInt(100);

      console.log(
        "Request CallBack price:",
        ethers.formatEther(requestCallBackPrice),
        "ETH"
      );
      const conditionBytes = encodeCondition(blockHeight);

      const tx = await contract.createTimelockRequestWithDirectFunding(
        callbackGasLimit,
        currentBlock,
        blockHeight,
        conditionBytes,
        encodeCiphertextToSolidity(cipherMessage),
        { value: requestCallBackPrice }
      );

      await tx.wait(2);

      console.log("Transaction sent:", tx);

      console.log("Request ID:", id);
      console.log("Ciphertext:", cipherMessage);
      setActiveTab("decrypt");
      setUserMessage(""); // Clear the input
      setBlocksAhead(""); // Clear the blocks input
      setEstimatedDecryptionTime("");
    },
  });

  return {
    handleEncrypt,
    setActiveTab,
    setUserMessage,
    setBlocksAhead,
    activeTab,
    userMessage,
    blocksAhead,
    estimatedDecryptionTime,
  };
};


import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import type { Account, Chain, Client, Transport } from "viem";
import { type Config, useConnectorClient } from "wagmi";

export const clientToSigner = (client: Client<Transport, Chain, Account>) => {
  const { account, chain, transport } = client;
  if (!chain) return null;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  provider.getSigner();
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
};

export const clientToProvider = (client: Client<Transport, Chain, Account>) => {
  const { chain, transport } = client;
  if (!chain) return null;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return provider;
};

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export const useEthersSigner = ({ chainId }: { chainId?: number } = {}) => {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
};
/** Hook to convert a viem Wallet Client to an ethers.js Provider. */
export const useEthersProvider = ({ chainId }: { chainId?: number } = {}) => {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client]
  );
};



import { useQuery } from "@tanstack/react-query";
import { useEthersProvider, useEthersSigner } from "@/hooks/useEthers";

import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useNetworkConfig } from "./useNetworkConfig";
import { CONTRACT_ABI } from "@/lib/contract";

export const useExplorer = (setActiveTab: (tab: string) => void) => {
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const { chainId } = useAccount();
  const { CONTRACT_ADDRESS } = useNetworkConfig();
  const { address } = useAccount();
  const getRequests = useQuery({
    queryKey: ["userRequests", chainId, address, CONTRACT_ADDRESS],
    queryFn: async () => {
      setActiveTab("decrypt");
      try {
        if (!signer || !provider || !chainId) {
          return [];
        }

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        const requestIdCount = await contract.currentRequestId();
        const totalRequests =
          typeof requestIdCount === "number"
            ? requestIdCount
            : Number(requestIdCount);
        if (!Number.isFinite(totalRequests) || totalRequests <= 0) {
          return [];
        }
        const startId = Math.max(1, totalRequests - 19);
        console.log("Request ID: ", totalRequests);
        const temp = [];
        for (let i = startId; i <= totalRequests; i++) {
          console.log(i);
          const r = await contract.userRequests(i);
          if (r.requestedBy == address) {
            temp.push({
              id: i,
              requestedBy: r[0],
              encryptedAt: r[1],
              decryptedAt: r[2],
              message: r[4],
            });
          }
        }
        return temp;
      } catch (error) {
        console.error("Error fetching request:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 0, // 5 minutes
  });

  return getRequests;
};



import {
  CHAIN_ID_BLOCK_TIME,
  CHAIN_ID_GAS_CONFIG,
  CHAIN_ID_TO_ADDRESS,
} from "@/lib/contract";
import { useAccount } from "wagmi";

export const useNetworkConfig = () => {
  const { chainId } = useAccount();
  const availableChains = Object.keys(CHAIN_ID_TO_ADDRESS);

  if (!chainId || !availableChains.includes(chainId.toString())) {
    console.warn("Chain not supported");
  }

  return {
    CONTRACT_ADDRESS:
      CHAIN_ID_TO_ADDRESS[
        chainId?.toString() as keyof typeof CHAIN_ID_TO_ADDRESS
      ],
    secondsPerBlock:
      CHAIN_ID_BLOCK_TIME[
        chainId?.toString() as keyof typeof CHAIN_ID_BLOCK_TIME
      ],
    gasConfig:
      CHAIN_ID_GAS_CONFIG[
        chainId?.toString() as keyof typeof CHAIN_ID_GAS_CONFIG
      ],
  };
};



// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract MyBlocklockReceiver is AbstractBlocklockReceiver {
    
    uint256 public currentRequestId;

    struct Request {
        address requestedBy;                 
        uint32 encryptedAt;                  
        uint32 decryptedAt;                  
        TypesLib.Ciphertext encryptedValue; 
        string message;                     
    }

    mapping(uint256 => Request) public userRequests;

    constructor(address blocklockSender) AbstractBlocklockReceiver(blocklockSender) {}

    function createTimelockRequestWithDirectFunding(
        uint32 callbackGasLimit,
        uint32 _encryptedAt,
        uint32 _decryptedAt,
        bytes calldata condition,
        TypesLib.Ciphertext calldata encryptedData
    ) external payable returns (uint256, uint256) {
        // create timelock request
        (uint256 _requestId, uint256 requestPrice) =
            _requestBlocklockPayInNative(callbackGasLimit, condition, encryptedData);
        // store request id
        currentRequestId = _requestId;
        currentRequestId = _requestId;
            // store Ciphertext
            userRequests[_requestId] = Request({
            requestedBy: msg.sender,
            encryptedAt: _encryptedAt,
            decryptedAt: _decryptedAt,
            encryptedValue: encryptedData,
            message:""
        });
        return (currentRequestId, requestPrice);
    }

    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        require(currentRequestId == _requestId, "Invalid request id.");
        Request storage request = userRequests[_requestId];
        // decrypt stored Ciphertext with decryption key
        request.message = abi.decode(_decrypt(request.encryptedValue, decryptionKey), (string));
    }
}




import { ethers } from "ethers";

export const CONTRACT_ADDRESS_FILECOIN =
  "0x2Eb638C8d78673A14322aBE1d0317AD32F3f5249";

export const CONTRACT_ADDRESS_CALIBRATION =
  "0x0F75cB85debC7A32a8B995362F28393E84ABABA6";

export const CONTRACT_ADDRESS_ARBITRUM_SEPOLIA =
  "0xBCF043CFB1D15cbAa22075B5FDA0554E3410Fa04";
export const CONTRACT_ADDRESS_OPTIMISM_SEPOLIA =
  "0x77d0A7cBa96AA6d739BEc63Ac53602c0f30a7947";
export const CONTRACT_ADDRESS_BASE_SEPOLIA =
  "0x6913a0E073e9009e282b7C5548809Ac8274f2e9B";

export const CHAIN_ID_TO_ADDRESS = {
  "314": CONTRACT_ADDRESS_FILECOIN,
  "314159": CONTRACT_ADDRESS_CALIBRATION,
  "421614": CONTRACT_ADDRESS_ARBITRUM_SEPOLIA,
  "11155420": CONTRACT_ADDRESS_OPTIMISM_SEPOLIA,
  "84532": CONTRACT_ADDRESS_BASE_SEPOLIA,
};

export const CHAIN_ID_BLOCK_TIME = {
  "314": 30,
  "314159": 30,
  "421614": 1,
  "11155420": 2,
  "84532": 1,
};

export const CHAIN_ID_GAS_CONFIG = {
  "137": {
    gasLimit: 10_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 100,
    callbackGasLimitDefault: 100_000,
    gasMultiplierDefault: 10,
    blocklockAddress: "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e",
  },
  "314": {
    gasLimit: 5_000_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 400,
    callbackGasLimitDefault: 444_000_000,
    gasMultiplierDefault: 50,
    blocklockAddress: "0x34092470CC59A097d770523931E3bC179370B44b",
  },
  "314159": {
    gasLimit: 5_000_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 400,
    callbackGasLimitDefault: 444_000_000,
    gasMultiplierDefault: 50,
    blocklockAddress: "0xF00aB3B64c81b6Ce51f8220EB2bFaa2D469cf702",
  },
  "421614": {
    gasLimit: 100_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 100,
    callbackGasLimitDefault: 1_000_000,
    gasMultiplierDefault: 10,
    blocklockAddress: "0xd22302849a87d5B00f13e504581BC086300DA080",
  },
  "11155420": {
    gasLimit: 100_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 100,
    callbackGasLimitDefault: 1_000_000,
    gasMultiplierDefault: 10,
    blocklockAddress: "0xd22302849a87d5B00f13e504581BC086300DA080",
  },
  "84532": {
    gasLimit: 100_000,
    maxFeePerGas: ethers.parseUnits("0.2", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("0.2", "gwei"),
    gasBufferPercent: 100,
    callbackGasLimitDefault: 1_000_000,
    gasMultiplierDefault: 10,
    blocklockAddress: "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e",
  },
};

export const BLOCKLOCK_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "uint32", name: "_callbackGasLimit", type: "uint32" },
      { internalType: "uint256", name: "_requestGasPriceWei", type: "uint256" },
    ],
    name: "estimateRequestPriceNative",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "createSubscriptionAndFundNative",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "callbackGasLimit",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "_encryptedAt",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "_decryptedAt",
        type: "uint32",
      },
      {
        internalType: "bytes",
        name: "condition",
        type: "bytes",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "x",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2]",
                name: "y",
                type: "uint256[2]",
              },
            ],
            internalType: "struct BLS.PointG2",
            name: "u",
            type: "tuple",
          },
          {
            internalType: "bytes",
            name: "v",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "w",
            type: "bytes",
          },
        ],
        internalType: "struct TypesLib.Ciphertext",
        name: "encryptedData",
        type: "tuple",
      },
    ],
    name: "createTimelockRequestWithDirectFunding",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "fundContractNative",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "blocklockSender",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Funded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "subscriptionId",
        type: "uint256",
      },
    ],
    name: "NewSubscriptionId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "OwnershipTransferRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "decryptionKey",
        type: "bytes",
      },
    ],
    name: "receiveBlocklock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "Received",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_blocklock",
        type: "address",
      },
    ],
    name: "setBlocklock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "subId",
        type: "uint256",
      },
    ],
    name: "setSubId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "topUpSubscriptionNative",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "consumers",
        type: "address[]",
      },
    ],
    name: "updateSubscription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "withdrawNative",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
  {
    inputs: [],
    name: "blocklock",
    outputs: [
      {
        internalType: "contract IBlocklockSender",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentRequestId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    name: "isInFlight",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "subId",
        type: "uint256",
      },
    ],
    name: "pendingRequestExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "subscriptionId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userRequests",
    outputs: [
      {
        internalType: "address",
        name: "requestedBy",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "encryptedAt",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "decryptedAt",
        type: "uint32",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "x",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2]",
                name: "y",
                type: "uint256[2]",
              },
            ],
            internalType: "struct BLS.PointG2",
            name: "u",
            type: "tuple",
          },
          {
            internalType: "bytes",
            name: "v",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "w",
            type: "bytes",
          },
        ],
        internalType: "struct TypesLib.Ciphertext",
        name: "encryptedValue",
        type: "tuple",
      },
      {
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];



"use client";
import React from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import Header from "./header";
import Wallet from "../wallet";

import { useExplorer } from "@/hooks/useExplorer";
import { useEncrypt } from "@/hooks/useEncrypt";
import Footer from "@/components/Footer";

const BlockLockPage = () => {
  const { isConnected } = useAccount();

  const {
    handleEncrypt: encryptMutation,
    setActiveTab,
    setUserMessage,
    setBlocksAhead,
    activeTab,
    userMessage,
    blocksAhead,
    estimatedDecryptionTime,
  } = useEncrypt();

  const {
    mutateAsync: handleEncrypt,
    isPending: isEncrypting,
    isError: isEncryptError,
    error: encryptError,
  } = encryptMutation;

  const {
    data: requests,
    isLoading: isLoadingRequests,
    refetch,
  } = useExplorer(setActiveTab);

  return isConnected ? (
    <div className="bg-white-pattern">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-20 font-sans min-h-screen">
        {/* Tabs - Stack on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row justify-end mb-6 gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <button
              className={`w-full sm:w-[200px] py-3 font-funnel-sans text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center ${
                activeTab === "text" ? "border-gray-400 bg-white" : ""
              }`}
              onClick={() => setActiveTab("text")}
            >
              Encrypt
            </button>
            <button
              className={`w-full sm:w-[200px] py-3 font-funnel-sans text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center ${
                activeTab === "decrypt" ? "border-gray-400 bg-white" : ""
              }`}
              onClick={() => refetch()}
            >
              Explorer
            </button>
          </div>
        </div>
        {activeTab === "text" ? (
          <div className="bg-white border border-gray-200 p-4 sm:p-8 h-[550px]">
            {/* Text Areas Section - Stack on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
              <div>
                <h2 className="text-xl text-gray-700 mb-4 font-funnel-display">
                  Plaintext
                </h2>
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="font-funnel-display w-full h-[200px]  text-gray-700 p-4 border border-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your text here..."
                />
              </div>
              <div className="hidden sm:block">
                <div className="w-full h-[280px] flex items-center justify-center">
                  <img
                    src="/assets/images/blocklock.gif"
                    alt="Encryption animation"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Blocks Ahead Section and Encrypt Button - Stack on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 p-4">
              <div>
                <h2 className="text-xl text-gray-700 mb-4 font-funnel-display">
                  Decryption Time
                </h2>
                <p className="text-lg text-gray-700 mb-4 font-funnel-display">
                  Blocks Ahead
                </p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Enter number of blocks ahead"
                    value={blocksAhead}
                    onChange={(e) => setBlocksAhead(e.target.value)}
                    className="font-funnel-display w-full px-4 py-2 border border-gray-300 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {estimatedDecryptionTime && (
                    <p className="text-sm text-gray-500 mt-2 font-funnel-display">
                      Estimated decryption: {estimatedDecryptionTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-end font-funnel-display mb-4">
                <button
                  onClick={() => handleEncrypt({ userMessage, blocksAhead })}
                  disabled={!userMessage || !blocksAhead || isEncrypting}
                  className={`font-funnel-display w-full h-11 text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center ${
                    !userMessage || !blocksAhead
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isEncrypting
                    ? "Encrypting..."
                    : isEncryptError
                    ? "Error Try Again"
                    : "Encrypt"}
                </button>
              </div>
            </div>
            {isEncryptError && (
              <div className="text-red-500 font-funnel-display max-w-5xl overflow-auto py-5">
                <div>{encryptError.message}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-4 sm:p-8 max-h-[900px] flex flex-col overflow-y-auto">
            {/* Explorer Section */}
            <div className="flex justify-between">
              <h2 className="text-xl text-gray-800 mb-6 font-funnel-display">
                Message Explorer
              </h2>
              <button onClick={() => refetch()}>
                <Image
                  className={`${
                    isLoadingRequests ? "animate-spin" : ""
                  } cursor-pointer mb-6`}
                  src="/assets/images/refresh.svg"
                  width={15}
                  height={15}
                  alt="Randamu Logo"
                />
              </button>
            </div>

            {requests && requests.length > 0 ? (
              <div className="overflow-y-auto flex-1 ">
                <div className="grid gap-6">
                  {requests.map((message) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 shadow-sm p-6 bg-gray-50"
                    >
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-sm font-funnel-display">
                            Request ID
                          </span>
                          <span className="text-gray-900 font-medium font-funnel-display">
                            {message.id}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-sm font-funnel-display">
                            Encryption Block Number
                          </span>
                          <span className="text-gray-900 font-medium font-funnel-display">
                            {message.encryptedAt}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-sm font-funnel-display">
                            Decryption Block Number
                          </span>
                          <span className="text-gray-900 font-medium font-funnel-display">
                            {message.decryptedAt}
                          </span>
                        </div>
                      </div>
                      {message.message != "" && (
                        <>
                          <div className="mt-2">
                            <span className="text-gray-500 text-sm font-funnel-display">
                              Decrypted Message
                            </span>
                            <div className="border border-gray-200 p-3 mt-1 bg-white overflow-x-auto">
                              <code className="text-sm text-gray-800 font-funnel-display">
                                {message.message}
                              </code>
                            </div>
                          </div>
                        </>
                      )}{" "}
                      {message.requestedBy != "" && (
                        <>
                          <div className="mt-2">
                            <span className="text-gray-500 text-sm font-funnel-display">
                              Requested By
                            </span>
                            <div className="border border-gray-200 p-3 mt-1 bg-white overflow-x-auto">
                              <code className="text-sm text-gray-800 font-funnel-display">
                                {message.requestedBy}
                              </code>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-funnel-display">
                  No encrypted messages found. Create one in the Encrypt tab.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  ) : (
    <Wallet />
  );
};

export default BlockLockPage;




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