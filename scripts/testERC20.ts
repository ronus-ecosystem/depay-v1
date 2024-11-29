import { ethers } from 'hardhat';

async function main() {
    // Load the DePayERC20 contract (Change the address to the deployed contract address)
    const contract_address = '0xe82210601cEcAeb863BB23E783709fDa7BB8a5D8';

    console.log('Testing DePay contract at:', contract_address);

    const [owner] = await ethers.getSigners();

    console.log('Owner address:', owner.address);

    const abi = require('../artifacts/contracts/DePayERC20.sol/DePayERC20.json').abi;

    const contract = new ethers.Contract(contract_address, abi, owner);

    // Listen for Payment events
    contract.on("Payment", (payer, recipient, amount, memo, providedHash, event) => {
        console.log(`
          📢 Payment Event Detected!
          ---------------------------------
          Payer: ${payer}
          Recipient: ${recipient}
          Amount: ${ethers.utils.formatEther(amount.toString())} LINK
          Memo: ${memo}
          Hash: ${providedHash}
        `);

        console.log('Event:', event);
    });

    try {
        // Load base token contract (LINK)
        const base_token_address = '0x779877A7B0D9E8603169DdbD7836e478b4624789';
        const token_abi = require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;
        const base_token_contract = new ethers.Contract(base_token_address, token_abi, owner);

        // Calculate required LINK for 100 USD
        const usd_amount = ethers.utils.parseEther('100'); // 100 USD
        const required_amount = await contract.get_required_amount(usd_amount);

        console.log('Required LINK for 100 USD (before buffer):', ethers.utils.formatEther(required_amount));

        // Add 4% buffer to the required LINK
        const buffer_percentage = 4; // 4% buffer
        const buffered_amount = required_amount.add(required_amount.mul(buffer_percentage).div(100)); // Add 4%

        console.log(
            'Required LINK for 100 USD (after buffer):',
            ethers.utils.formatEther(buffered_amount)
        );

        // Approve LINK for the contract
        console.log("Approving LINK for the contract...");

        const approve_tx = await base_token_contract.connect(owner).approve(contract.address, buffered_amount);

        await approve_tx.wait();

        console.log(`Approved ${ethers.utils.formatEther(buffered_amount)} LINK for contract`);

        // Generate hash of payment data
        const recipient = owner.address;
        const memo = "test_payment:" + new Date().getTime();
        const calculated_hash = ethers.utils.solidityKeccak256(
            ["address", "uint256", "string"],
            [recipient, usd_amount, memo]
        );

        console.log("Calculated hash:", calculated_hash);

        // Call the `pay` function with buffered ETH and hash
        console.log("Sending payment to contract...");

        const tx_pay = await contract.connect(owner).pay(recipient, usd_amount, memo, calculated_hash);

        await tx_pay.wait();

        console.log("Payment transaction completed:", tx_pay.hash);

        // Try reusing the same hash (should fail)
        console.log("Attempting to reuse the same hash (should fail)...");
        try {
            const tx_fail = await contract.connect(owner).pay(recipient, usd_amount, memo, calculated_hash);

            await tx_fail.wait();
        } catch (error) {
            console.error("Reusing hash failed as expected:", (error as Record<string, string>).message);
        };

        // User withdraw balance
        console.log("Withdrawing owner balance...");

        const tx_withdraw = await contract.connect(owner).withdraw();

        await tx_withdraw.wait();

        console.log("Withdraw transaction completed:", tx_withdraw.hash);

        // Withdraw treasury balance
        console.log("Withdrawing treasury balance...");

        const tx_treasury_withdraw = await contract.treasury_withdraw(base_token_address);

        await tx_treasury_withdraw.wait();

        console.log("Treasury withdraw transaction completed:", tx_treasury_withdraw.hash);
    } finally {
        contract.removeAllListeners("Payment");
    };
}

main().catch((error) => {
    console.error('Error in testing:', error);
    process.exitCode = 1;
});