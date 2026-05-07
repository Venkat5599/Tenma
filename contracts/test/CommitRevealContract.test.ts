import { expect } from "chai";
import { ethers } from "hardhat";
import { CommitRevealContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CommitRevealContract", function () {
  let contract: CommitRevealContract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  const EXECUTION_DELAY = 300; // 5 minutes
  const REVEAL_WINDOW = 86400; // 24 hours
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const CommitRevealContractFactory = await ethers.getContractFactory("CommitRevealContract");
    contract = await CommitRevealContractFactory.deploy(EXECUTION_DELAY, REVEAL_WINDOW);
    await contract.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct execution delay", async function () {
      expect(await contract.executionDelay()).to.equal(EXECUTION_DELAY);
    });
    
    it("Should set the correct reveal window", async function () {
      expect(await contract.revealWindow()).to.equal(REVEAL_WINDOW);
    });
    
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });
  
  describe("Commit", function () {
    it("Should create a commitment", async function () {
      const secret = ethers.randomBytes(32);
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [user2.address, 0, "0x"]
      );
      const commitmentHash = ethers.keccak256(
        ethers.concat([payload, secret])
      );
      
      const tx = await contract.connect(user1).commit(commitmentHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(contract, "CommitmentCreated")
        .withArgs(commitmentHash, user1.address, block!.timestamp);
      
      const commitment = await contract.getCommitment(commitmentHash);
      expect(commitment.user).to.equal(user1.address);
      expect(commitment.revealed).to.be.false;
      expect(commitment.executed).to.be.false;
    });
    
    it("Should revert if commitment already exists", async function () {
      const commitmentHash = ethers.randomBytes(32);
      
      await contract.connect(user1).commit(commitmentHash);
      
      await expect(
        contract.connect(user1).commit(commitmentHash)
      ).to.be.revertedWithCustomError(contract, "CommitmentAlreadyExists");
    });
  });
  
  describe("Reveal", function () {
    let secret: Uint8Array;
    let payload: string;
    let commitmentHash: string;
    
    beforeEach(async function () {
      secret = ethers.randomBytes(32);
      payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [user2.address, 0, "0x"]
      );
      commitmentHash = ethers.keccak256(
        ethers.concat([payload, secret])
      );
      
      await contract.connect(user1).commit(commitmentHash);
    });
    
    it("Should reveal and execute after delay", async function () {
      // Advance time past execution delay
      await time.increase(EXECUTION_DELAY + 1);
      
      await expect(contract.connect(user1).reveal(payload, secret))
        .to.emit(contract, "TransactionRevealed")
        .and.to.emit(contract, "TransactionExecuted");
      
      const commitment = await contract.getCommitment(commitmentHash);
      expect(commitment.revealed).to.be.true;
      expect(commitment.executed).to.be.true;
    });
    
    it("Should revert if execution delay not elapsed", async function () {
      await expect(
        contract.connect(user1).reveal(payload, secret)
      ).to.be.revertedWithCustomError(contract, "ExecutionDelayNotElapsed");
    });
    
    it("Should revert if commitment not found", async function () {
      const wrongSecret = ethers.randomBytes(32);
      
      await time.increase(EXECUTION_DELAY + 1);
      
      await expect(
        contract.connect(user1).reveal(payload, wrongSecret)
      ).to.be.revertedWithCustomError(contract, "CommitmentNotFound");
    });
    
    it("Should revert if unauthorized caller", async function () {
      await time.increase(EXECUTION_DELAY + 1);
      
      await expect(
        contract.connect(user2).reveal(payload, secret)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedCaller");
    });
    
    it("Should revert if already revealed", async function () {
      await time.increase(EXECUTION_DELAY + 1);
      
      await contract.connect(user1).reveal(payload, secret);
      
      await expect(
        contract.connect(user1).reveal(payload, secret)
      ).to.be.revertedWithCustomError(contract, "CommitmentAlreadyRevealed");
    });
    
    it("Should revert if expired", async function () {
      await time.increase(REVEAL_WINDOW + 1);
      
      await expect(
        contract.connect(user1).reveal(payload, secret)
      ).to.be.revertedWithCustomError(contract, "CommitmentExpired");
    });
  });
  
  describe("View Functions", function () {
    let secret: Uint8Array;
    let payload: string;
    let commitmentHash: string;
    
    beforeEach(async function () {
      secret = ethers.randomBytes(32);
      payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [user2.address, 0, "0x"]
      );
      commitmentHash = ethers.keccak256(
        ethers.concat([payload, secret])
      );
      
      await contract.connect(user1).commit(commitmentHash);
    });
    
    it("Should return correct canReveal status", async function () {
      expect(await contract.canReveal(commitmentHash)).to.be.false;
      
      await time.increase(EXECUTION_DELAY + 1);
      
      expect(await contract.canReveal(commitmentHash)).to.be.true;
    });
    
    it("Should return correct isExpired status", async function () {
      expect(await contract.isExpired(commitmentHash)).to.be.false;
      
      await time.increase(REVEAL_WINDOW + 1);
      
      expect(await contract.isExpired(commitmentHash)).to.be.true;
    });
    
    it("Should return correct remaining delay", async function () {
      const remaining = await contract.getRemainingDelay(commitmentHash);
      expect(remaining).to.be.closeTo(EXECUTION_DELAY, 5);
      
      await time.increase(EXECUTION_DELAY + 1);
      
      expect(await contract.getRemainingDelay(commitmentHash)).to.equal(0);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update execution delay", async function () {
      const newDelay = 600;
      
      await expect(contract.setExecutionDelay(newDelay))
        .to.emit(contract, "ExecutionDelayUpdated")
        .withArgs(EXECUTION_DELAY, newDelay);
      
      expect(await contract.executionDelay()).to.equal(newDelay);
    });
    
    it("Should allow owner to update reveal window", async function () {
      const newWindow = 172800;
      
      await expect(contract.setRevealWindow(newWindow))
        .to.emit(contract, "RevealWindowUpdated")
        .withArgs(REVEAL_WINDOW, newWindow);
      
      expect(await contract.revealWindow()).to.equal(newWindow);
    });
    
    it("Should allow owner to pause", async function () {
      await contract.pause();
      
      const commitmentHash = ethers.randomBytes(32);
      
      await expect(
        contract.connect(user1).commit(commitmentHash)
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });
    
    it("Should allow owner to unpause", async function () {
      await contract.pause();
      await contract.unpause();
      
      const commitmentHash = ethers.randomBytes(32);
      
      await expect(
        contract.connect(user1).commit(commitmentHash)
      ).to.not.be.reverted;
    });
    
    it("Should revert if non-owner tries to update delay", async function () {
      await expect(
        contract.connect(user1).setExecutionDelay(600)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });
});
