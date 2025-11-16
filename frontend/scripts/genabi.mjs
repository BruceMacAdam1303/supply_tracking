import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "SupplyChainTracking";

// <root>/contracts
const rel = "../contracts";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/contracts${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

// Network name to chainId mapping
// This can be extended as needed
const networkChainIdMap = {
  localhost: 31337,
  hardhat: 31337,
  anvil: 31337,
  sepolia: 11155111,
  mainnet: 1,
  goerli: 5,
  // Add more networks as needed
};

// Network name to display name mapping
const networkDisplayNameMap = {
  localhost: "hardhat",
  hardhat: "hardhat",
  anvil: "anvil",
  sepolia: "sepolia",
  mainnet: "mainnet",
  goerli: "goerli",
};

/**
 * Read deployment information from a network directory
 * @param {string} chainName - Network name (directory name)
 * @param {string} contractName - Contract name
 * @returns {object|undefined} Deployment object with address, abi, chainId, or undefined if not found
 */
function readDeployment(chainName, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractFile)) {
    return undefined;
  }

  try {
    const jsonString = fs.readFileSync(contractFile, "utf-8");
    const obj = JSON.parse(jsonString);
    
    // Get chainId from mapping or use the one in the file if available
    const chainId = networkChainIdMap[chainName] || obj.chainId;
    const chainDisplayName = networkDisplayNameMap[chainName] || chainName;
    
    if (!chainId) {
      console.warn(`Warning: No chainId found for network '${chainName}'. Skipping.`);
      return undefined;
    }

    obj.chainId = chainId;
    obj.chainName = chainDisplayName;
    console.log(`Found deployment on ${chainName} (chainId: ${chainId}): ${obj.address}`);
    return obj;
  } catch (error) {
    console.warn(`Warning: Error reading deployment file for ${chainName}: ${error.message}`);
    return undefined;
  }
}

// Check if deployments directory exists
if (!fs.existsSync(deploymentsDir)) {
  console.warn(`Warning: Deployments directory not found: ${deploymentsDir}`);
  console.warn("No deployments found. Generating empty ABI and address files.");
  
  // Generate empty files
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  No deployments found.
*/
export const ${CONTRACT_NAME}ABI = { abi: [] } as const;
\n`;
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  No deployments found.
*/
export const ${CONTRACT_NAME}Addresses = {};
`;

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
  
  console.log(`Generated empty ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`Generated empty ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
  process.exit(0);
}

// Automatically discover all deployments
console.log("Scanning for deployments...");
const deployments = [];
const addresses = {};

// Get all subdirectories in deployments directory
try {
  const entries = fs.readdirSync(deploymentsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const chainName = entry.name;
      const deployment = readDeployment(chainName, CONTRACT_NAME);
      
      if (deployment) {
        deployments.push(deployment);
        // Add to addresses object using chainId as key
        addresses[deployment.chainId.toString()] = {
          address: deployment.address,
          chainId: deployment.chainId,
          chainName: deployment.chainName,
        };
      } else {
        console.log(`Skipping ${chainName}: deployment not found or invalid`);
      }
    }
  }
} catch (error) {
  console.error(`Error scanning deployments directory: ${error.message}`);
  process.exit(1);
}

// Check if we found any deployments
if (deployments.length === 0) {
  console.warn("No valid deployments found. Generating empty ABI and address files.");
  
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  No deployments found.
*/
export const ${CONTRACT_NAME}ABI = { abi: [] } as const;
\n`;
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  No deployments found.
*/
export const ${CONTRACT_NAME}Addresses = {};
`;

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
  
  console.log(`Generated empty ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`Generated empty ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
  process.exit(0);
}

// Get ABI from the first deployment (all should have the same ABI)
let abi = deployments[0].abi;

// Verify ABI consistency across all deployments
if (deployments.length > 1) {
  const firstAbiString = JSON.stringify(deployments[0].abi);
  for (let i = 1; i < deployments.length; i++) {
    const currentAbiString = JSON.stringify(deployments[i].abi);
    if (firstAbiString !== currentAbiString) {
      console.warn(
        `${line}Warning: ABI differs between deployments. Using ABI from ${deployments[0].chainName} (${deployments[0].chainId}).${line}`
      );
      break;
    }
  }
}

console.log(`\nFound ${deployments.length} deployment(s):`);
deployments.forEach((deployment) => {
  console.log(`  - ${deployment.chainName} (${deployment.chainId}): ${deployment.address}`);
});

// Generate TypeScript files
const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abi }, null, 2)} as const;
\n`;

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = ${JSON.stringify(addresses, null, 2)};
`;

console.log(`\nGenerated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

console.log("\nDone!");
