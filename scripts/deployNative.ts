import { ethers } from 'hardhat'; // Import ethers.js from the Hardhat framework

async function main() {
    // Retrieve the current network information from the ethers provider
    const network = await ethers.provider.getNetwork();

    // Log the name of the network where the contract is being deployed
    console.log(`Deploying to network: ${network.name}`);

    console.log('Deploying DePayNative contract...');

    /**
     * Load the DePayNative contract factory.
     * The contract factory provides a way to deploy new instances of the smart contract.
     * It uses the ABI (Application Binary Interface) and bytecode from the compiled contract.
     */
    const DePayNative = await ethers.getContractFactory('DePayNative');

    /**
     * Address of the Chainlink ETH/USD Price Feed on the Sepolia testnet.
     * - This address is used by the DePayNative contract to fetch the price of ETH in USD.
     * - For production deployment, this should be replaced with the appropriate address for the target network (e.g., Mainnet).
     */
    const registry_address = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia ETH/USD price feed address

    /**
     * Deploy the DePayNative contract.
     * - `registry_address`: Passed as a constructor argument to the contract, allowing it to access the price feed for ETH/USD.
     * - `DePayNative.deploy()` handles the actual deployment of the contract to the blockchain.
     */
    const depay = await DePayNative.deploy(registry_address);

    // Wait until the contract deployment is completed
    await depay.deployed();

    // Log the address of the deployed contract
    console.log('DePayNative contract deployed to:', depay.address);
}

// Main entry point for the deployment script
main().catch((error) => {
    // Handle any errors that occur during deployment
    console.error('Error in deployment:', error);
    process.exitCode = 1; // Set the process exit code to indicate failure
});