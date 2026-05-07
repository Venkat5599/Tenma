import { expect } from "chai";
import { ethers } from "hardhat";
import { TenmaFirewall } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("TenmaFirewall", function () {
  let firewall: TenmaFirewall;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let agent: SignerWithAddress;
  let target: SignerWithAddress;
  let attacker: SignerWithAddress;

  const MAX_TRANSACTION = ethers.parseEther("10");
  const MAX_DAILY = ethers.parseEther("50");
  const MAX_GAS_PRICE = ethers.parseUnits("100", "gwei");
  const MAX_RISK_SCORE = 50;

  beforeEach(async function () {
    [owner, user, agent, target, attacker] = await ethers.getSigners();

    const TenmaFirewall = await ethers.getContractFactory("TenmaFirewall");
    firewall = await TenmaFirewall.deploy();
    await firewall.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await firewall.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await firewall.paused()).to.equal(false);
    });
  });

  describe("Policy Management", function () {
    it("Should allow user to set policy", async function () {
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );

      const policy = await firewall.getPolicy(user.address);
      expect(policy.maxTransactionAmount).to.equal(MAX_TRANSACTION);
      expect(policy.maxDailyAmount).to.equal(MAX_DAILY);
      expect(policy.maxGasPrice).to.equal(MAX_GAS_PRICE);
      expect(policy.maxRiskScore).to.equal(MAX_RISK_SCORE);
      expect(policy.enabled).to.equal(true);
    });

    it("Should reject invalid risk score", async function () {
      await expect(
        firewall.connect(user).setPolicy(
          MAX_TRANSACTION,
          MAX_DAILY,
          MAX_GAS_PRICE,
          101, // Invalid: > 100
          false
        )
      ).to.be.revertedWith("TenmaFirewall: Invalid risk score");
    });

    it("Should reject daily limit < transaction limit", async function () {
      await expect(
        firewall.connect(user).setPolicy(
          MAX_DAILY,
          MAX_TRANSACTION, // Daily < transaction
          MAX_GAS_PRICE,
          MAX_RISK_SCORE,
          false
        )
      ).to.be.revertedWith("TenmaFirewall: Daily limit < transaction limit");
    });

    it("Should allow setting time restrictions", async function () {
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );

      await firewall.connect(user).setTimeRestrictions(true, 9, 17);

      const policy = await firewall.getPolicy(user.address);
      expect(policy.timeRestrictions.enabled).to.equal(true);
      expect(policy.timeRestrictions.startHour).to.equal(9);
      expect(policy.timeRestrictions.endHour).to.equal(17);
    });

    it("Should allow disabling policy", async function () {
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );

      await firewall.connect(user).disablePolicy();

      const policy = await firewall.getPolicy(user.address);
      expect(policy.enabled).to.equal(false);
    });
  });

  describe("Whitelist Management", function () {
    it("Should allow adding to whitelist", async function () {
      await firewall.connect(user).addToWhitelist(target.address);
      expect(await firewall.isWhitelisted(user.address, target.address)).to.equal(true);
    });

    it("Should allow removing from whitelist", async function () {
      await firewall.connect(user).addToWhitelist(target.address);
      await firewall.connect(user).removeFromWhitelist(target.address);
      expect(await firewall.isWhitelisted(user.address, target.address)).to.equal(false);
    });

    it("Should reject zero address", async function () {
      await expect(
        firewall.connect(user).addToWhitelist(ethers.ZeroAddress)
      ).to.be.revertedWith("TenmaFirewall: Invalid address");
    });
  });

  describe("Blacklist Management", function () {
    it("Should allow owner to add to blacklist", async function () {
      await firewall.connect(owner).addToBlacklist(attacker.address);
      expect(await firewall.isBlacklisted(attacker.address)).to.equal(true);
    });

    it("Should allow owner to remove from blacklist", async function () {
      await firewall.connect(owner).addToBlacklist(attacker.address);
      await firewall.connect(owner).removeFromBlacklist(attacker.address);
      expect(await firewall.isBlacklisted(attacker.address)).to.equal(false);
    });

    it("Should reject non-owner adding to blacklist", async function () {
      await expect(
        firewall.connect(user).addToBlacklist(attacker.address)
      ).to.be.revertedWith("TenmaFirewall: Only owner");
    });
  });

  describe("Risk Score Management", function () {
    it("Should allow owner to set risk score", async function () {
      await firewall.connect(owner).setRiskScore(target.address, 75);
      expect(await firewall.contractRiskScores(target.address)).to.equal(75);
    });

    it("Should allow batch setting risk scores", async function () {
      const targets = [target.address, agent.address];
      const scores = [25, 50];

      await firewall.connect(owner).batchSetRiskScores(targets, scores);

      expect(await firewall.contractRiskScores(target.address)).to.equal(25);
      expect(await firewall.contractRiskScores(agent.address)).to.equal(50);
    });

    it("Should reject invalid risk score", async function () {
      await expect(
        firewall.connect(owner).setRiskScore(target.address, 101)
      ).to.be.revertedWith("TenmaFirewall: Invalid risk score");
    });

    it("Should reject non-owner setting risk score", async function () {
      await expect(
        firewall.connect(user).setRiskScore(target.address, 50)
      ).to.be.revertedWith("TenmaFirewall: Only owner");
    });
  });

  describe("Agent Management", function () {
    it("Should allow authorizing agent", async function () {
      await firewall.connect(user).authorizeAgent(agent.address);
      expect(await firewall.approvedAgents(user.address, agent.address)).to.equal(true);
    });

    it("Should allow revoking agent", async function () {
      await firewall.connect(user).authorizeAgent(agent.address);
      await firewall.connect(user).revokeAgent(agent.address);
      expect(await firewall.approvedAgents(user.address, agent.address)).to.equal(false);
    });

    it("Should reject zero address", async function () {
      await expect(
        firewall.connect(user).authorizeAgent(ethers.ZeroAddress)
      ).to.be.revertedWith("TenmaFirewall: Invalid agent");
    });
  });

  describe("Commit-Reveal Flow", function () {
    let commitmentHash: string;
    let secret: string;

    beforeEach(async function () {
      // Setup policy
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );

      // Create commitment
      secret = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.parseEther("1");
      const data = "0x";

      commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );
    });

    it("Should allow committing transaction", async function () {
      await expect(firewall.connect(user).commit(commitmentHash))
        .to.emit(firewall, "CommitmentCreated")
        .withArgs(commitmentHash, user.address, await time.latest() + 1);
    });

    it("Should reject duplicate commitment", async function () {
      await firewall.connect(user).commit(commitmentHash);
      await expect(
        firewall.connect(user).commit(commitmentHash)
      ).to.be.revertedWith("TenmaFirewall: Commitment exists");
    });

    it("Should allow revealing after delay", async function () {
      await firewall.connect(user).commit(commitmentHash);

      // Wait 5 minutes
      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.emit(firewall, "TransactionExecuted");
    });

    it("Should reject revealing before delay", async function () {
      await firewall.connect(user).commit(commitmentHash);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Delay not elapsed");
    });

    it("Should reject revealing after window expires", async function () {
      await firewall.connect(user).commit(commitmentHash);

      // Wait 25 hours (past 24-hour window)
      await time.increase(25 * 60 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Reveal window expired");
    });

    it("Should reject revealing with wrong secret", async function () {
      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";
      const wrongSecret = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        firewall.connect(user).reveal(target.address, value, data, wrongSecret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: No commitment");
    });

    it("Should check canReveal correctly", async function () {
      await firewall.connect(user).commit(commitmentHash);

      // Before delay
      let [canReveal, remainingDelay] = await firewall.canReveal(commitmentHash);
      expect(canReveal).to.equal(false);
      expect(remainingDelay).to.be.gt(0);

      // After delay
      await time.increase(5 * 60);
      [canReveal, remainingDelay] = await firewall.canReveal(commitmentHash);
      expect(canReveal).to.equal(true);
      expect(remainingDelay).to.equal(0);
    });
  });

  describe("Policy Validation", function () {
    beforeEach(async function () {
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );
    });

    it("Should block transaction exceeding max amount", async function () {
      const secret = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.parseEther("15"); // Exceeds 10 ETH limit
      const data = "0x";

      const commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Exceeds max transaction amount");
    });

    it("Should block transaction exceeding daily limit", async function () {
      // First transaction: 40 ETH
      let secret = ethers.hexlify(ethers.randomBytes(32));
      let value = ethers.parseEther("9");
      let data = "0x";

      for (let i = 0; i < 5; i++) {
        secret = ethers.hexlify(ethers.randomBytes(32));
        const commitmentHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "uint256", "bytes", "bytes32"],
            [target.address, value, data, secret]
          )
        );

        await firewall.connect(user).commit(commitmentHash);
        await time.increase(5 * 60);
        await firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        });
      }

      // Sixth transaction: Would exceed 50 ETH daily limit
      secret = ethers.hexlify(ethers.randomBytes(32));
      value = ethers.parseEther("6");

      const commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Exceeds daily limit");
    });

    it("Should block blacklisted contract", async function () {
      await firewall.connect(owner).addToBlacklist(target.address);

      const secret = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.parseEther("1");
      const data = "0x";

      const commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Target is blacklisted");
    });

    it("Should block high risk score", async function () {
      await firewall.connect(owner).setRiskScore(target.address, 75);

      const secret = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.parseEther("1");
      const data = "0x";

      const commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Risk score too high");
    });

    it("Should simulate transaction correctly", async function () {
      const value = ethers.parseEther("5");
      const [allowed, reason] = await firewall.simulateTransaction(
        user.address,
        target.address,
        value
      );

      expect(allowed).to.equal(true);
      expect(reason).to.equal("Transaction allowed");
    });

    it("Should simulate blocked transaction correctly", async function () {
      const value = ethers.parseEther("15"); // Exceeds limit
      const [allowed, reason] = await firewall.simulateTransaction(
        user.address,
        target.address,
        value
      );

      expect(allowed).to.equal(false);
      expect(reason).to.equal("Exceeds max transaction amount");
    });
  });

  describe("Manual Approval Flow", function () {
    let commitmentHash: string;
    let secret: string;

    beforeEach(async function () {
      // Setup policy with manual approval
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        true // Require approval
      );

      secret = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.parseEther("1");
      const data = "0x";

      commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
    });

    it("Should require approval before reveal", async function () {
      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Approval required");
    });

    it("Should allow reveal after approval", async function () {
      await firewall.connect(user).approveTransaction(commitmentHash);
      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.emit(firewall, "TransactionExecuted");
    });

    it("Should allow authorized agent to approve", async function () {
      await firewall.connect(user).authorizeAgent(agent.address);
      await firewall.connect(agent).approveTransaction(commitmentHash);

      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.emit(firewall, "TransactionExecuted");
    });

    it("Should allow rejecting transaction", async function () {
      await firewall.connect(user).rejectTransaction(commitmentHash);

      await time.increase(5 * 60);

      const value = ethers.parseEther("1");
      const data = "0x";

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.be.revertedWith("TenmaFirewall: Already executed");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow owner to pause", async function () {
      await firewall.connect(owner).pause();
      expect(await firewall.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      await firewall.connect(owner).pause();
      await firewall.connect(owner).unpause();
      expect(await firewall.paused()).to.equal(false);
    });

    it("Should block transactions when paused", async function () {
      await firewall.connect(owner).pause();

      const commitmentHash = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        firewall.connect(user).commit(commitmentHash)
      ).to.be.revertedWith("TenmaFirewall: Contract is paused");
    });

    it("Should reject non-owner pause", async function () {
      await expect(
        firewall.connect(user).pause()
      ).to.be.revertedWith("TenmaFirewall: Only owner");
    });

    it("Should allow owner to transfer ownership", async function () {
      await firewall.connect(owner).transferOwnership(user.address);
      expect(await firewall.owner()).to.equal(user.address);
    });
  });

  describe("Daily Reset", function () {
    it("Should reset daily spent after 24 hours", async function () {
      await firewall.connect(user).setPolicy(
        MAX_TRANSACTION,
        MAX_DAILY,
        MAX_GAS_PRICE,
        MAX_RISK_SCORE,
        false
      );

      // First transaction
      let secret = ethers.hexlify(ethers.randomBytes(32));
      let value = ethers.parseEther("9");
      let data = "0x";

      let commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);
      await firewall.connect(user).reveal(target.address, value, data, secret, {
        value: value,
      });

      // Wait 24 hours
      await time.increase(24 * 60 * 60);

      // Second transaction (should work after reset)
      secret = ethers.hexlify(ethers.randomBytes(32));
      value = ethers.parseEther("9");

      commitmentHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "bytes", "bytes32"],
          [target.address, value, data, secret]
        )
      );

      await firewall.connect(user).commit(commitmentHash);
      await time.increase(5 * 60);

      await expect(
        firewall.connect(user).reveal(target.address, value, data, secret, {
          value: value,
        })
      ).to.emit(firewall, "TransactionExecuted");
    });
  });
});
