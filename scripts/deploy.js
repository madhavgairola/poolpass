const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("PoolPass Deployment to Local Hardhat Network");
  console.log("==================================================");

  const [deployer, treasury, demoUser] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Treasury (Service Provider):", treasury.address);
  console.log("Demo User (Pre-funded):", demoUser.address);

  // 1. Deploy MockERC20 (mUSDC with 18 decimals)
  console.log("\n[1/3] Deploying MockERC20 (mUSDC)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy("Mock USD Coin", "mUSDC", 18);
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("MockERC20 deployed at:", tokenAddress);

  // 2. Deploy MockYieldPool
  console.log("\n[2/3] Deploying MockYieldPool...");
  const MockYieldPoolFactory = await ethers.getContractFactory("MockYieldPool");
  const mockYieldPool = await MockYieldPoolFactory.deploy(tokenAddress);
  await mockYieldPool.waitForDeployment();
  const yieldPoolAddress = await mockYieldPool.getAddress();
  console.log("MockYieldPool deployed at:", yieldPoolAddress);

  // 3. Deploy PoolPass
  console.log("\n[3/3] Deploying PoolPass Core Contract...");
  const PoolPassFactory = await ethers.getContractFactory("PoolPass");
  const poolPass = await PoolPassFactory.deploy(
    tokenAddress,
    yieldPoolAddress,
    treasury.address
  );
  await poolPass.waitForDeployment();
  const poolPassAddress = await poolPass.getAddress();
  console.log("PoolPass deployed at:", poolPassAddress);

  // 4. Seed initial liquidity & faucet funds
  console.log("\nSeeding Mock Pool reserve liquidity (1,000,000 mUSDC)...");
  await mockToken.faucet(yieldPoolAddress, ethers.parseEther("1000000"));

  console.log("Minting initial test tokens to Demo User (10,000 mUSDC)...");
  await mockToken.faucet(demoUser.address, ethers.parseEther("10000"));

  // Also mint to deployer for quick testing if connected with default account #0
  await mockToken.faucet(deployer.address, ethers.parseEther("10000"));

  // 5. Export contract artifacts & addresses to frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const deployedAddresses = {
    network: "localhost",
    chainId: 31337,
    stakingToken: tokenAddress,
    yieldPool: yieldPoolAddress,
    poolPass: poolPassAddress,
    treasury: treasury.address,
    demoUser: demoUser.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "deployedAddresses.json"),
    JSON.stringify(deployedAddresses, null, 2)
  );

  // Extract minimal ABIs
  const mockTokenArtifact = await hre.artifacts.readArtifact("MockERC20");
  const mockYieldPoolArtifact = await hre.artifacts.readArtifact("MockYieldPool");
  const poolPassArtifact = await hre.artifacts.readArtifact("PoolPass");

  fs.writeFileSync(
    path.join(frontendContractsDir, "MockERC20.json"),
    JSON.stringify(mockTokenArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendContractsDir, "MockYieldPool.json"),
    JSON.stringify(mockYieldPoolArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendContractsDir, "PoolPass.json"),
    JSON.stringify(poolPassArtifact, null, 2)
  );

  console.log("\nArtifacts successfully exported to frontend/src/contracts/");
  console.log("Deployed addresses summary:");
  console.table(deployedAddresses);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
