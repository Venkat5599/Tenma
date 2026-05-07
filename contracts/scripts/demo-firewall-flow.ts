import { ethers } from "hardhat";

async function main() {
  console.log("🔥 Tenma Firewall - Full Demo Flow\n");
  console.log("=".repeat(80));
  console.log("This demo shows the complete on-chain firewall functionality:");
  console.log("1. Policy configuration");
  console.log("2. Whitelist management");
  console.log("3. Successful transaction (passes all policies)");
  console.log("4. Blocked transaction (exceeds amount limit)");
  console.log("5. Blocked transaction (blacklisted contract)");
  console.log("6. Blocked transaction (high risk score)");
  console.log("7. Manual approval flow");
  console.log("=".repeat(80) + "\n");

  const [deployer, user, target, malicious] = await ethers.getSigners();

  // Deploy contract
  console.log("📝 Deploying TenmaFirewall...");
  const TenmaFirewall = await ethers.getContractFactory("TenmaFirewall");
  const firewall = await TenmaFirewall.deploy();
  await firewall.waitForDeployment();
  const firewallAddress = await firewall.getAddress();
  console.log("✅ Deployed to:", firewallAddress, "\n");

  // ============ Step 1: Configure Policy ============
  console.log("📋 Step 1: Configure Policy");
  console.log("-".repeat(80));

  const maxTransaction = ethers.parseEther("10");
  const maxDaily = ethers.parseEther("50");
  const maxGasPrice = ethers.parseUnits("100", "gwei");
  const maxRiskScore = 50;

  const tx1 = await firewall.connect(user).setPolicy(
    maxTransaction,
    maxDaily,
    maxGasPrice,
    maxRiskScore,
    false
  );
  await tx1.wait();

  console.log("✅ Policy configured:");
  console.log("   - Max Transaction:", ethers.formatEther(maxTransaction), "ETH");
  console.log("   - Max Daily:", ethers.formatEther(maxDaily), "ETH");
  console.log("   - Max Gas Price:", ethers.formatUnits(maxGasPrice, "gwei"), "Gwei");
  console.log("   - Max Risk Score:", maxRiskScore);
  console.log("");

  // ============ Step 2: Whitelist Management ============
  console.log("📋 Step 2: Whitelist Management");
  console.log("-".repeat(80));

  const tx2 = await firewall.connect(user).addToWhitelist(target.address);
  await tx2.wait();
  console.log("✅ Whitelisted contract:", target.address);

  const tx3 = await firewall.connect(deployer).addToBlacklist(malicious.address);
  await tx3.wait();
  console.log("✅ Blacklisted contract:", malicious.address);

  const tx4 = await firewall.connect(deployer).setRiskScore(target.address, 25);
  await tx4.wait();
  console.log("✅ Set risk score for target:", 25, "(low risk)");

  const tx5 = await firewall.connect(deployer).setRiskScore(malicious.address, 90);
  await tx5.wait();
  console.log("✅ Set risk score for malicious:", 90, "(high risk)");
  console.log("");

  // ============ Step 3: Successful Transaction ============
  console.log("📋 Step 3: Successful Transaction (Passes All Policies)");
  console.log("-".repeat(80));

  let secret = ethers.hexlify(ethers.randomBytes(32));
  let value = ethers.parseEther("5"); // Within limits
  let data = "0x";

  let commitmentHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes", "bytes32"],
      [target.address, value, data, secret]
    )
  );

  console.log("1️⃣  Committing transaction...");
  console.log("   - Target:", target.address);
  console.log("   - Value:", ethers.formatEther(value), "ETH");
  console.log("   - Commitment Hash:", commitmentHash);

  const tx6 = await firewall.connect(user).commit(commitmentHash);
  await tx6.wait();
  console.log("✅ Transaction committed");

  console.log("⏰ Waiting 5 minutes (MEV protection delay)...");
  await ethers.provider.send("evm_increaseTime", [5 * 60]);
  await ethers.provider.send("evm_mine", []);

  console.log("2️⃣  Revealing transaction...");
  const tx7 = await firewall.connect(user).reveal(target.address, value, data, secret, {
    value: value,
  });
  await tx7.wait();
  console.log("✅ Transaction executed successfully!");
  console.log("   - All policies passed ✓");
  console.log("   - Amount within limit ✓");
  console.log("   - Contract whitelisted ✓");
  console.log("   - Risk score acceptable ✓");
  console.log("");

  // ============ Step 4: Blocked - Amount Limit ============
  console.log("📋 Step 4: Blocked Transaction (Exceeds Amount Limit)");
  console.log("-".repeat(80));

  secret = ethers.hexlify(ethers.randomBytes(32));
  value = ethers.parseEther("15"); // Exceeds 10 ETH limit

  commitmentHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes", "bytes32"],
      [target.address, value, data, secret]
    )
  );

  console.log("1️⃣  Committing transaction...");
  console.log("   - Target:", target.address);
  console.log("   - Value:", ethers.formatEther(value), "ETH (EXCEEDS LIMIT!)");

  const tx8 = await firewall.connect(user).commit(commitmentHash);
  await tx8.wait();
  console.log("✅ Transaction committed");

  console.log("⏰ Waiting 5 minutes...");
  await ethers.provider.send("evm_increaseTime", [5 * 60]);
  await ethers.provider.send("evm_mine", []);

  console.log("2️⃣  Attempting to reveal...");
  try {
    await firewall.connect(user).reveal(target.address, value, data, secret, {
      value: value,
    });
    console.log("❌ ERROR: Transaction should have been blocked!");
  } catch (error: any) {
    console.log("✅ Transaction BLOCKED by firewall!");
    console.log("   - Reason:", error.message.includes("Exceeds max transaction amount") ? "Exceeds max transaction amount" : "Unknown");
    console.log("   - On-chain enforcement prevented unauthorized transaction ✓");
  }
  console.log("");

  // ============ Step 5: Blocked - Blacklisted Contract ============
  console.log("📋 Step 5: Blocked Transaction (Blacklisted Contract)");
  console.log("-".repeat(80));

  secret = ethers.hexlify(ethers.randomBytes(32));
  value = ethers.parseEther("1"); // Within limits

  commitmentHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes", "bytes32"],
      [malicious.address, value, data, secret]
    )
  );

  console.log("1️⃣  Committing transaction...");
  console.log("   - Target:", malicious.address, "(BLACKLISTED!)");
  console.log("   - Value:", ethers.formatEther(value), "ETH");

  const tx9 = await firewall.connect(user).commit(commitmentHash);
  await tx9.wait();
  console.log("✅ Transaction committed");

  console.log("⏰ Waiting 5 minutes...");
  await ethers.provider.send("evm_increaseTime", [5 * 60]);
  await ethers.provider.send("evm_mine", []);

  console.log("2️⃣  Attempting to reveal...");
  try {
    await firewall.connect(user).reveal(malicious.address, value, data, secret, {
      value: value,
    });
    console.log("❌ ERROR: Transaction should have been blocked!");
  } catch (error: any) {
    console.log("✅ Transaction BLOCKED by firewall!");
    console.log("   - Reason:", error.message.includes("blacklisted") ? "Target is blacklisted" : "Unknown");
    console.log("   - Malicious contract interaction prevented ✓");
  }
  console.log("");

  // ============ Step 6: Simulation ============
  console.log("📋 Step 6: Transaction Simulation (Before Committing)");
  console.log("-".repeat(80));

  console.log("Simulating valid transaction...");
  let [allowed, reason] = await firewall.simulateTransaction(
    user.address,
    target.address,
    ethers.parseEther("5")
  );
  console.log("   - Allowed:", allowed);
  console.log("   - Reason:", reason);

  console.log("\nSimulating invalid transaction (exceeds limit)...");
  [allowed, reason] = await firewall.simulateTransaction(
    user.address,
    target.address,
    ethers.parseEther("15")
  );
  console.log("   - Allowed:", allowed);
  console.log("   - Reason:", reason);

  console.log("\nSimulating blacklisted contract...");
  [allowed, reason] = await firewall.simulateTransaction(
    user.address,
    malicious.address,
    ethers.parseEther("1")
  );
  console.log("   - Allowed:", allowed);
  console.log("   - Reason:", reason);
  console.log("");

  // ============ Step 7: Manual Approval Flow ============
  console.log("📋 Step 7: Manual Approval Flow");
  console.log("-".repeat(80));

  console.log("Enabling manual approval requirement...");
  const tx10 = await firewall.connect(user).setPolicy(
    maxTransaction,
    maxDaily,
    maxGasPrice,
    maxRiskScore,
    true // Require approval
  );
  await tx10.wait();
  console.log("✅ Manual approval enabled");

  secret = ethers.hexlify(ethers.randomBytes(32));
  value = ethers.parseEther("3");

  commitmentHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes", "bytes32"],
      [target.address, value, data, secret]
    )
  );

  console.log("\n1️⃣  Committing transaction...");
  const tx11 = await firewall.connect(user).commit(commitmentHash);
  await tx11.wait();
  console.log("✅ Transaction committed");

  console.log("⏰ Waiting 5 minutes...");
  await ethers.provider.send("evm_increaseTime", [5 * 60]);
  await ethers.provider.send("evm_mine", []);

  console.log("\n2️⃣  Attempting to reveal without approval...");
  try {
    await firewall.connect(user).reveal(target.address, value, data, secret, {
      value: value,
    });
    console.log("❌ ERROR: Should require approval!");
  } catch (error: any) {
    console.log("✅ Transaction BLOCKED - approval required!");
  }

  console.log("\n3️⃣  Approving transaction...");
  const tx12 = await firewall.connect(user).approveTransaction(commitmentHash);
  await tx12.wait();
  console.log("✅ Transaction approved");

  console.log("\n4️⃣  Revealing approved transaction...");
  const tx13 = await firewall.connect(user).reveal(target.address, value, data, secret, {
    value: value,
  });
  await tx13.wait();
  console.log("✅ Transaction executed after approval!");
  console.log("");

  // ============ Summary ============
  console.log("=".repeat(80));
  console.log("🎉 DEMO COMPLETE!");
  console.log("=".repeat(80));
  console.log("\n✅ Demonstrated Features:");
  console.log("   1. Policy configuration (amount limits, gas limits, risk scores)");
  console.log("   2. Whitelist/blacklist management");
  console.log("   3. Successful transaction (all policies passed)");
  console.log("   4. Blocked transaction (amount limit exceeded)");
  console.log("   5. Blocked transaction (blacklisted contract)");
  console.log("   6. Transaction simulation (before committing)");
  console.log("   7. Manual approval flow");
  console.log("\n🔒 Security Guarantees:");
  console.log("   ✓ All policies enforced on-chain");
  console.log("   ✓ Cannot be bypassed by AI agent");
  console.log("   ✓ Cannot be bypassed by compromised frontend");
  console.log("   ✓ Blockchain guarantees enforcement");
  console.log("   ✓ MEV protection via commit-reveal");
  console.log("\n💡 Key Takeaway:");
  console.log("   Tenma provides TRUE on-chain enforcement for AI agent transactions.");
  console.log("   Policies are validated by smart contracts, not client-side code.");
  console.log("   This makes it impossible for AI agents to bypass security rules.");
  console.log("\n" + "=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });
