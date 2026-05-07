import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CommitRevealContract...");
  
  // Configuration
  const EXECUTION_DELAY = 300; // 5 minutes
  const REVEAL_WINDOW = 86400; // 24 hours
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy contract
  const CommitRevealContract = await ethers.getContractFactory("CommitRevealContract");
  const contract = await CommitRevealContract.deploy(EXECUTION_DELAY, REVEAL_WINDOW);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("CommitRevealContract deployed to:", address);
  console.log("Execution Delay:", EXECUTION_DELAY, "seconds");
  console.log("Reveal Window:", REVEAL_WINDOW, "seconds");
  
  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: address,
    deployer: deployer.address,
    executionDelay: EXECUTION_DELAY,
    revealWindow: REVEAL_WINDOW,
    timestamp: new Date().toISOString(),
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network ${deploymentInfo.network} ${address} ${EXECUTION_DELAY} ${REVEAL_WINDOW}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
