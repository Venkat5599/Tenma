import { ethers } from "hardhat";

async function main() {
  console.log("🔥 Deploying Tenma Firewall to 0G Newton Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy TenmaFirewall
  console.log("📝 Deploying TenmaFirewall contract...");
  const TenmaFirewall = await ethers.getContractFactory("TenmaFirewall");
  const firewall = await TenmaFirewall.deploy();
  await firewall.waitForDeployment();

  const firewallAddress = await firewall.getAddress();
  console.log("✅ TenmaFirewall deployed to:", firewallAddress);

  // Get deployment transaction
  const deployTx = firewall.deploymentTransaction();
  if (deployTx) {
    console.log("📋 Deployment transaction hash:", deployTx.hash);
    console.log("⛽ Gas used:", deployTx.gasLimit.toString());
  }

  // Verify contract details
  console.log("\n📊 Contract Details:");
  console.log("- Owner:", await firewall.owner());
  console.log("- Paused:", await firewall.paused());
  console.log("- Commit Delay:", (await firewall.COMMIT_DELAY()).toString(), "seconds (5 minutes)");
  console.log("- Reveal Window:", (await firewall.REVEAL_WINDOW()).toString(), "seconds (24 hours)");
  console.log("- Max Risk Score:", (await firewall.MAX_RISK_SCORE()).toString());

  // Setup example policies
  console.log("\n🔧 Setting up example policies...");
  
  const maxTransaction = ethers.parseEther("10");
  const maxDaily = ethers.parseEther("50");
  const maxGasPrice = ethers.parseUnits("100", "gwei");
  const maxRiskScore = 50;

  const tx = await firewall.setPolicy(
    maxTransaction,
    maxDaily,
    maxGasPrice,
    maxRiskScore,
    false // Don't require approval
  );
  await tx.wait();

  console.log("✅ Example policy set for deployer:");
  console.log("- Max Transaction:", ethers.formatEther(maxTransaction), "ETH");
  console.log("- Max Daily:", ethers.formatEther(maxDaily), "ETH");
  console.log("- Max Gas Price:", ethers.formatUnits(maxGasPrice, "gwei"), "Gwei");
  console.log("- Max Risk Score:", maxRiskScore);

  // Setup example whitelists
  console.log("\n📋 Setting up example whitelists...");
  
  // Whitelist some common contracts (example addresses)
  const uniswapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
  const sushiswapRouter = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; // SushiSwap Router
  
  const tx1 = await firewall.addToWhitelist(uniswapV2Router);
  await tx1.wait();
  console.log("✅ Whitelisted Uniswap V2 Router:", uniswapV2Router);
  
  const tx2 = await firewall.addToWhitelist(sushiswapRouter);
  await tx2.wait();
  console.log("✅ Whitelisted SushiSwap Router:", sushiswapRouter);

  // Set example risk scores
  console.log("\n🎯 Setting example risk scores...");
  
  const tx3 = await firewall.setRiskScore(uniswapV2Router, 10); // Low risk
  await tx3.wait();
  console.log("✅ Set Uniswap V2 risk score: 10 (low risk)");
  
  const tx4 = await firewall.setRiskScore(sushiswapRouter, 15); // Low risk
  await tx4.wait();
  console.log("✅ Set SushiSwap risk score: 15 (low risk)");

  // Save deployment info
  console.log("\n💾 Saving deployment information...");
  
  const deploymentInfo = {
    network: "0G Newton Testnet",
    chainId: 16602,
    contracts: {
      TenmaFirewall: {
        address: firewallAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: deployTx?.hash || "N/A",
      },
    },
    examplePolicies: {
      maxTransactionAmount: ethers.formatEther(maxTransaction) + " ETH",
      maxDailyAmount: ethers.formatEther(maxDaily) + " ETH",
      maxGasPrice: ethers.formatUnits(maxGasPrice, "gwei") + " Gwei",
      maxRiskScore: maxRiskScore,
    },
    whitelistedContracts: [
      { name: "Uniswap V2 Router", address: uniswapV2Router, riskScore: 10 },
      { name: "SushiSwap Router", address: sushiswapRouter, riskScore: 15 },
    ],
  };

  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "tenma-firewall.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("✅ Deployment info saved to deployments/tenma-firewall.json");

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(80));
  console.log("\n📋 Contract Address:", firewallAddress);
  console.log("🔗 Explorer:", `https://chainscan-newton.0g.ai/address/${firewallAddress}`);
  console.log("\n📖 Next Steps:");
  console.log("1. Verify contract on block explorer");
  console.log("2. Update frontend with new contract address");
  console.log("3. Test policy enforcement");
  console.log("4. Configure additional whitelists and risk scores");
  console.log("\n💡 Usage:");
  console.log("- Set your policy: firewall.setPolicy(...)");
  console.log("- Whitelist contracts: firewall.addToWhitelist(address)");
  console.log("- Commit transaction: firewall.commit(commitmentHash)");
  console.log("- Reveal after 5 min: firewall.reveal(target, value, data, secret)");
  console.log("\n" + "=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
