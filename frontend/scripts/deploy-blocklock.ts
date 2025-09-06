// import { ethers } from "hardhat";

// async function main() {
//   console.log("🚀 Deploying UniKycBlocklock contract...");

//   // Get the contract factory
//   const UniKycBlocklock = await ethers.getContractFactory("UniKycBlocklock");

//   // Dcipher network blocklock sender addresses for different networks
//   const blocklockSenders = {
//     baseSepolia: "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e",
//     filecoinCalibration: "0xF00aB3B64c81b6Ce51f8220EB2bFaa2D469cf702",
//     polygon: "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e"
//   };

//   // Deploy to Base Sepolia (testnet)
//   console.log("📡 Deploying to Base Sepolia...");
//   const blocklockBaseSepolia = await UniKycBlocklock.deploy(blocklockSenders.baseSepolia);
//   await blocklockBaseSepolia.waitForDeployment();
//   const baseSepoliaAddress = await blocklockBaseSepolia.getAddress();
  
//   console.log("✅ UniKycBlocklock deployed to Base Sepolia at:", baseSepoliaAddress);

//   // Deploy to Filecoin Calibration (testnet)
//   console.log("📡 Deploying to Filecoin Calibration...");
//   const blocklockFilecoin = await UniKycBlocklock.deploy(blocklockSenders.filecoinCalibration);
//   await blocklockFilecoin.waitForDeployment();
//   const filecoinAddress = await blocklockFilecoin.getAddress();
  
//   console.log("✅ UniKycBlocklock deployed to Filecoin Calibration at:", filecoinAddress);

//   // Deploy to Polygon (mainnet)
//   console.log("📡 Deploying to Polygon...");
//   const blocklockPolygon = await UniKycBlocklock.deploy(blocklockSenders.polygon);
//   await blocklockPolygon.waitForDeployment();
//   const polygonAddress = await blocklockPolygon.getAddress();
  
//   console.log("✅ UniKycBlocklock deployed to Polygon at:", polygonAddress);

//   console.log("\n🎉 Deployment Summary:");
//   console.log("Base Sepolia:", baseSepoliaAddress);
//   console.log("Filecoin Calibration:", filecoinAddress);
//   console.log("Polygon:", polygonAddress);

//   // Save deployment addresses to a config file
//   const deploymentConfig = {
//     networks: {
//       baseSepolia: {
//         contractAddress: baseSepoliaAddress,
//         blocklockSender: blocklockSenders.baseSepolia,
//         chainId: 84532
//       },
//       filecoinCalibration: {
//         contractAddress: filecoinAddress,
//         blocklockSender: blocklockSenders.filecoinCalibration,
//         chainId: 314159
//       },
//       polygon: {
//         contractAddress: polygonAddress,
//         blocklockSender: blocklockSenders.polygon,
//         chainId: 137
//       }
//     },
//     deployedAt: new Date().toISOString(),
//     version: "1.0.0"
//   };

//   // Write to deployment config
//   const fs = require('fs');
//   fs.writeFileSync(
//     'deployment-config.json',
//     JSON.stringify(deploymentConfig, null, 2)
//   );

//   console.log("\n📝 Deployment configuration saved to deployment-config.json");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error("❌ Deployment failed:", error);
//     process.exit(1);
//   });
