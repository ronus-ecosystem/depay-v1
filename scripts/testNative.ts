import { ethers } from 'hardhat';

async function main() {
    // Load the DePayNative contract (Change the address to the deployed contract address)
    const contract_address = '0x016627FC3eBd6A296a88204BC5Fa77f5db6f2D1e';

    console.log('Testing DePay contract at:', contract_address);

    const [owner] = await ethers.getSigners();

    console.log('Owner address:', owner.address);

    const abi = require('../artifacts/contracts/DePayNative.sol/DePayNative.json').abi;

    const contract = new ethers.Contract(contract_address, abi, owner);

    // Listen for Payment events
    contract.on("Payment", (payer, recipient, amount, memo, providedHash, event) => {
        console.log(`
          📢 Payment Event Detected!
          ---------------------------------
          Payer: ${payer}
          Recipient: ${recipient}
          Amount: ${ethers.utils.formatEther(amount.toString())} ETH
          Memo: ${memo}
          Hash: ${providedHash}
        `);

        console.log('Event:', event);
    });

    // Calculate required ETH for 100 USD
    const usd_amount = ethers.utils.parseEther('100'); // 100 USD
    const required_eth = await contract.get_required_amount(usd_amount);

    console.log('Required ETH for 100 USD (before buffer):', ethers.utils.formatEther(required_eth));

    // Add 4% buffer to the required ETH
    const buffer_percentage = 4; // 4% buffer
    const buffered_eth = required_eth.add(required_eth.mul(buffer_percentage).div(100)); // Add 4%

    console.log(
        'Required ETH for 100 USD (after buffer):',
        ethers.utils.formatEther(buffered_eth)
    );

    // Generate hash of payment data
    const recipient = owner.address;
    const memo = 'test_payment:' + new Date().getTime();
    const calculated_hash = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'string'],
        [recipient, usd_amount, memo]
    );

    console.log('Calculated hash:', calculated_hash);

    // Call the `pay` function with buffered ETH and hash
    console.log('Sending payment to contract...');

    const tx_pay = await contract.pay(recipient, usd_amount, memo, calculated_hash, { value: buffered_eth, gasLimit: 3000000 });

    await tx_pay.wait();

    console.log('Payment transaction completed:', tx_pay.hash);

    // Try reusing the same hash (should fail)
    console.log('Attempting to reuse the same hash (should fail)...');
    try {
        const tx_fail = await contract.pay(recipient, usd_amount, memo, calculated_hash, { value: buffered_eth });

        await tx_fail.wait();
    } catch (error) {
        console.error('Reusing hash failed as expected:', (error as Record<string, string>).message);
    }

    // Withdraw user balance
    console.log('Withdrawing user balance...');

    const tx_withdraw = await contract.withdraw();

    await tx_withdraw.wait();

    console.log('Withdraw transaction completed:', tx_withdraw.hash);

    // Withdraw treasury balance
    console.log('Withdrawing treasury balance...');

    const tx_treasury_withdraw = await contract.treasury_withdraw(ethers.constants.AddressZero);

    await tx_treasury_withdraw.wait();

    console.log('Treasury withdraw transaction completed:', tx_treasury_withdraw.hash);
}

main().catch((error) => {
    console.error('Error in testing:', error);
    process.exitCode = 1;
});