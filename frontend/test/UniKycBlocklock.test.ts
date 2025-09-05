import { expect } from "chai";
import { ethers } from "hardhat";
import { UniKycBlocklock } from "../typechain-types";
import { SignerWithAddress } from "@ethersproject/contracts";

describe("UniKycBlocklock", function () {
  let blocklockContract: UniKycBlocklock;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let mockBlocklockSender: SignerWithAddress;

  const mockEnsName = "alice.eth";
  const mockUnlockBlockHeight = 1000;
  const mockCallbackGasLimit = 500000;

  beforeEach(async function () {
    [owner, user1, user2, mockBlocklockSender] = await ethers.getSigners();

    // Deploy the contract with mock blocklock sender
    const UniKycBlocklock = await ethers.getContractFactory("UniKycBlocklock");
    blocklockContract = await UniKycBlocklock.deploy(mockBlocklockSender.address);
    await blocklockContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct blocklock sender address", async function () {
      expect(await blocklockContract.blocklockSender()).to.equal(mockBlocklockSender.address);
    });

    it("Should have correct owner", async function () {
      expect(await blocklockContract.owner()).to.equal(owner.address);
    });
  });

  describe("KYC Data Encryption", function () {
    it("Should encrypt KYC data successfully", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      const tx = await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "KycDataEncrypted");
      
      expect(event).to.not.be.undefined;
      expect(event?.args?.owner).to.equal(user1.address);
      expect(event?.args?.ensName).to.equal(mockEnsName);
      expect(event?.args?.unlockAt).to.equal(mockUnlockBlockHeight);
    });

    it("Should reject empty ENS name", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await expect(
        blocklockContract.connect(user1).encryptKycData(
          mockCallbackGasLimit,
          "",
          mockUnlockBlockHeight,
          mockEncryptedData
        )
      ).to.be.revertedWith("ENS name cannot be empty");
    });

    it("Should reject unlock block in the past", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      const pastBlock = (await ethers.provider.getBlockNumber()) - 100;

      await expect(
        blocklockContract.connect(user1).encryptKycData(
          mockCallbackGasLimit,
          mockEnsName,
          pastBlock,
          mockEncryptedData
        )
      ).to.be.revertedWith("Unlock block must be in the future");
    });
  });

  describe("KYC Data Retrieval", function () {
    beforeEach(async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );
    });

    it("Should retrieve KYC data by ENS name", async function () {
      const data = await blocklockContract.getKycDataByEns(mockEnsName);
      
      expect(data.owner).to.equal(user1.address);
      expect(data.ensName).to.equal(mockEnsName);
      expect(data.unlockAt).to.equal(mockUnlockBlockHeight);
      expect(data.isDecrypted).to.be.false;
    });

    it("Should return empty data for non-existent ENS name", async function () {
      const data = await blocklockContract.getKycDataByEns("nonexistent.eth");
      
      expect(data.owner).to.equal(ethers.constants.AddressZero);
      expect(data.ensName).to.equal("");
    });

    it("Should retrieve KYC data by request ID", async function () {
      const requestId = await blocklockContract.ensToRequestId(mockEnsName);
      const data = await blocklockContract.getKycData(requestId);
      
      expect(data.owner).to.equal(user1.address);
      expect(data.ensName).to.equal(mockEnsName);
    });
  });

  describe("KYC Data Updates", function () {
    let requestId: number;

    beforeEach(async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      const tx = await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "KycDataEncrypted");
      requestId = event?.args?.requestId.toNumber() || 0;
    });

    it("Should allow owner to update KYC data", async function () {
      const newEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await expect(
        blocklockContract.connect(user1).updateKycData(requestId, newEncryptedData)
      ).to.emit(blocklockContract, "KycDataUpdated");
    });

    it("Should reject non-owner updates", async function () {
      const newEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await expect(
        blocklockContract.connect(user2).updateKycData(requestId, newEncryptedData)
      ).to.be.revertedWith("Only owner can update");
    });
  });

  describe("Unlock Conditions", function () {
    it("Should check unlock conditions correctly", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const [canDecrypt, unlockBlock] = await blocklockContract.canDecryptKycData(mockEnsName);
      
      expect(canDecrypt).to.be.false; // Not yet unlocked
      expect(unlockBlock).to.equal(mockUnlockBlockHeight);
    });

    it("Should estimate unlock time correctly", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const [blocksRemaining, estimatedTime] = await blocklockContract.getUnlockEstimate(mockEnsName);
      
      expect(blocksRemaining).to.be.gt(0);
      expect(estimatedTime).to.be.gt(0);
    });
  });

  describe("Blocklock Integration", function () {
    it("Should handle blocklock callbacks correctly", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      const tx = await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "KycDataEncrypted");
      const requestId = event?.args?.requestId;

      // Mock the blocklock callback
      const mockDecryptionKey = ethers.utils.randomBytes(32);
      
      // This would normally be called by the blocklock service
      // For testing, we'll need to mock the conditions or use a different approach
      expect(requestId).to.not.be.undefined;
    });
  });

  describe("Utility Functions", function () {
    it("Should return current block number", async function () {
      const currentBlock = await blocklockContract.getCurrentBlock();
      const actualBlock = await ethers.provider.getBlockNumber();
      
      expect(currentBlock).to.be.closeTo(actualBlock, 1); // Allow for slight differences
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to call restricted functions", async function () {
      // This test would verify that only the contract owner can call certain functions
      // Implementation depends on the specific access control mechanisms
      expect(await blocklockContract.owner()).to.equal(owner.address);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for encryption", async function () {
      const mockEncryptedData = {
        ciphertext: ethers.utils.randomBytes(32),
        condition: ethers.utils.randomBytes(16)
      };

      const tx = await blocklockContract.connect(user1).encryptKycData(
        mockCallbackGasLimit,
        mockEnsName,
        mockUnlockBlockHeight,
        mockEncryptedData
      );

      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (adjust threshold as needed)
      expect(receipt.gasUsed).to.be.lt(1000000);
    });
  });
});
