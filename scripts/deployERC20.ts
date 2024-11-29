import { ethers } from "hardhat"; // Import ethers.js from the Hardhat framework

async function main() {
    // Retrieve the current network information from the ethers provider
    const network = await ethers.provider.getNetwork();

    // Log the name of the network where the contract is being deployed (e.g., "sepolia" or "mainnet")
    console.log(`Deploying to network: ${network.name}`);

    console.log("Deploying DePayERC20 contract...");

    /**
     * Address of the Chainlink LINK/USD Price Feed on the Sepolia testnet.
     * - This is used by the contract to fetch the current price of LINK in USD.
     * - Replace this with the appropriate price feed address for the target network.
     */
    const registry_address = "0xc59E3633BAAC79493d908e63626716e204A45EdF"; // Sepolia LINK/USD price feed

    /**
     * Address of the mock USDC token deployed on the Sepolia testnet.
     * - This is the base token (ERC20) that the DePayERC20 contract will use for payments.
     * - Replace this with the address of the actual token you want to use on the target network.
     */
    const base_address = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia USDC mock token address

    // Load the DePayERC20 contract factory (the blueprint for deploying the contract)
    const DePayERC20 = await ethers.getContractFactory("DePayERC20");

    /**
     * Deploy the DePayERC20 contract with the required constructor arguments:
     * - `registry_address`: Address of the Chainlink Price Feed.
     * - `base_address`: Address of the ERC20 token used as the base currency (e.g., USDC).
     */
    const depayERC20 = await DePayERC20.deploy(registry_address, base_address);

    // Wait until the contract is fully deployed on the blockchain
    await depayERC20.deployed();

    // Log the address of the deployed contract
    console.log("DePayERC20 deployed to:", depayERC20.address);
}

// Main entry point for the deployment script
main().catch((error) => {
    // Handle any errors that occur during deployment
    console.error("Error in deployment:", error);
    process.exitCode = 1; // Set the process exit code to indicate failure
});