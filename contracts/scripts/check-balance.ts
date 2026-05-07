import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("Wallet Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Balance is 0!");
    console.log("Get testnet ETH from: https://sepoliafaucet.com/");
    console.log("Or use: https://www.alchemy.com/faucets/ethereum-sepolia");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
