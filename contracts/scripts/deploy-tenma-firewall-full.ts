import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying TenmaFirewall to 0G Network...\n");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "A0GI\n");
  
  if (balance === 0n) {
    console.error("❌ Error: Account has no balance. Get test tokens from 0G faucet.");
    process.exit(1);
  }
  
  // Deploy TenmaFirewall
  console.log("📦 Deploying TenmaFirewall contract...");
  const TenmaFirewall = await ethers.getContractFactory("TenmaFirewall");
  const firewall = await TenmaFirewall.deploy();
  
  await firewall.waitForDeployment();
  const firewallAddress = await firewall.getAddress();
  
  console.log("✅ TenmaFirewall deployed to:", firewallAddress);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // Save deployment info
  const deploymentInfo = {
    network: "0G Newton Testnet",
    chainId: chainId,
    contracts: {
      TenmaFirewall: firewallAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };
  
  // Update deployments.json
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  let deployments: any = {};
  
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  }
  
  deployments.TenmaFirewall = deploymentInfo;
  
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n✅ Deployment info saved to deployments.json");
  
  console.log("\n🔍 Verification command:");
  console.log(`npx hardhat verify --network 0gNewton ${firewallAddress}`);
  
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on block explorer");
  console.log("2. Update frontend with contract address");
  console.log("3. Test contract functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
