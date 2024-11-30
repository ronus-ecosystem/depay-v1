// SPDX-License-Identifier: MIT
/**
 * @title DePayERC20 Contract
 * @standard WT-DP-1E
 * @description ERC20-based implementation of a payment processing system called DePay.
 * It allows users to make payments, withdraw funds, and manage balances with integrated fee handling.
 * Developed by Wilson Tran.
 */
pragma solidity ^0.8.20;

// Importing required OpenZeppelin contracts for security and standardization
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/AggregatorV3Interface.sol"; // Import interface for Oracle integration

/**
 * @dev Main contract for DePayERC20 payment system.
 */
contract DePayERC20 {
    // Mapping to store user balances
    mapping(address => uint256) public balances;

    // Mapping to store used hashes to prevent replay attacks
    mapping(bytes32 => bool) private used_hashes;

    // Reentrancy lock to prevent recursive calls
    bool private reentrancy_lock;

    // Total sum of balances held in the contract
    uint256 private total_balances;

    // Fee percentage (in basis points, e.g., 100 = 1%)
    uint256 public fee_percent = 10;

    // Address of the price feed oracle (for USD price retrieval)
    address public registry_address;

    // Decimals of the price feed oracle
    uint8 public registry_decimals;

    // Address of the base token used for payments
    address public base_address;

    // Owner of the contract (for administrative purposes)
    address public owner;

    // Price feed oracle instance
    AggregatorV3Interface private price_feed;

    /**
     * @dev Event emitted when a payment is made.
     */
    event Payment(
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string memo,
        bytes32 provided_hash
    );

    /**
     * @dev Event emitted when the fee percentage is modified.
     */
    event FeeModified(uint256 new_fee_percent);

    /**
     * @dev Constructor to initialize the contract.
     * @param _registry_address Address of the oracle registry for price feed.
     * @param _base_address Address of the ERC20 token used for payments.
     */
    constructor(address _registry_address, address _base_address) {
        owner = msg.sender; // Assign the contract deployer as the owner
        registry_address = _registry_address;
        base_address = _base_address;

        // Initialize the price feed oracle
        price_feed = AggregatorV3Interface(_registry_address);

        // Retrieve the decimals of the price feed oracle
        registry_decimals = price_feed.decimals();
    }

    /**
     * @dev Fallback function to accept Ether deposits (if required in future).
     */
    receive() external payable {}

    /**
     * @dev Modifier to restrict access to only the contract owner.
     */
    modifier only_owner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    /**
     * @dev Modifier to prevent reentrant calls.
     */
    modifier reentrancy_guard() {
        require(!reentrancy_lock, "ReentrancyGuard: reentrant call");
        reentrancy_lock = true;
        _;
        reentrancy_lock = false;
    }

    /**
     * @dev Allows the owner to transfer ownership to a new address.
     * @param new_owner Address of the new owner.
     */
    function transfer_ownership(address new_owner) public only_owner {
        require(
            new_owner != address(0),
            "New owner cannot be the zero address"
        );
        owner = new_owner;
    }

    /**
     * @dev Allows the owner to modify the fee percentage.
     * @param _fee_percent New fee percentage (must be between 4 and 40).
     */
    function modify_fee(uint256 _fee_percent) public only_owner {
        require(
            _fee_percent >= 4 && _fee_percent <= 40,
            "Fee must be between 0.04% and 0.4%"
        );
        fee_percent = _fee_percent;
        emit FeeModified(_fee_percent); // Emit event to notify fee change
    }

    /**
     * @dev Allows the owner to withdraw the treasury balance (collected fees).
     * @param token_address Address of the token to withdraw (or 0x0 for ETH).
     */
    function treasury_withdraw(
        address token_address
    ) public only_owner reentrancy_guard {
        if (token_address == address(0)) {
            // For Ether withdrawal
            uint256 withdrawable = address(this).balance - total_balances;
            require(withdrawable > 0, "No treasury balance to withdraw");

            // Transfer Ether to the owner
            (bool sent, ) = payable(owner).call{value: withdrawable}("");
            require(sent, "Failed to withdraw Ether from treasury");
        } else {
            // For ERC20 token withdrawal
            IERC20 token = IERC20(token_address);
            uint256 withdrawable = token.balanceOf(address(this)) -
                total_balances;
            require(withdrawable > 0, "No treasury balance to withdraw");

            // Use SafeERC20 for secure token transfer
            SafeERC20.safeTransfer(token, owner, withdrawable);
        }
    }

    /**
     * @dev Retrieves the latest native currency price in USD using the oracle.
     * @return Native currency price in USD with 18 decimal places.
     */
    function get_price() internal view returns (uint256) {
        (, int price, , , ) = price_feed.latestRoundData();

        require(price > 0, "Invalid price from oracle");

        return uint256(price) * (10 ** (18 - registry_decimals)); // Scale price to 18 decimals
    }

    /**
     * @dev Calculates the required amount of native currency for a given USD amount.
     * @param usd_amount Amount in USD to convert.
     * @return Required native currency amount (with 18 decimal places).
     */
    function get_required_amount(
        uint256 usd_amount
    ) public view returns (uint256) {
        uint256 usd_price = get_price();
        return (usd_amount * 10 ** 18) / usd_price; // Convert USD to native currency
    }

    /**
     * @dev Allows users to withdraw their balance.
     */
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        balances[msg.sender] = 0; // Reset user balance
        total_balances -= amount; // Update total balances

        // Transfer the corresponding amount of base token
        IERC20 token = IERC20(base_address);
        SafeERC20.safeTransfer(token, msg.sender, amount);
    }

    /**
     * @dev Allows users to make a payment in ERC20 tokens.
     * This function validates the payment data using a pre-calculated hash and calculates fees.
     *
     * @param recipient The address of the payment recipient.
     * @param usd_amount The amount (in USD) to pay, which will be converted to the respective currency.
     * @param memo A custom memo or description for the payment.
     * @param provided_hash The hash of payment data (recipient, usd_amount, memo) provided by the caller.
     */
    function pay(
        address recipient,
        uint256 usd_amount,
        string memory memo,
        bytes32 provided_hash
    ) public payable {
        // Ensure the recipient address is valid
        require(recipient != address(0), "Recipient cannot be zero address");

        // Ensure the USD amount to pay is greater than zero
        require(usd_amount > 0, "Payment amount must be greater than zero");

        // Calculate the hash of payment data and compare it with the provided hash
        bytes32 calculated_hash = keccak256(
            abi.encodePacked(recipient, usd_amount, memo)
        );

        // Validate the provided hash
        require(calculated_hash == provided_hash, "Invalid payment data");

        // Check if the payment hash has been used before
        require(!used_hashes[provided_hash], "Payment hash already used");

        // Mark the hash as used to prevent replay attacks
        used_hashes[provided_hash] = true;

        // Fetch the current price of the native token in USD from the oracle
        uint256 token_price_usd = get_price();
        require(token_price_usd > 0, "Oracle returned invalid price");

        // Calculate the required amount of tokens (e.g., USDT, USDC)
        uint256 token_amount_required = (usd_amount * 1e18) / token_price_usd;

        IERC20 token = IERC20(base_address);

        // Check the sender's token balance and allowance
        require(
            token.balanceOf(msg.sender) >= token_amount_required,
            "ERC20InsufficientBalance"
        );
        require(
            token.allowance(msg.sender, address(this)) >= token_amount_required,
            "ERC20InsufficientAllowance"
        );

        // Calculate the net amount after deducting the fee
        uint256 net_amount = token_amount_required -
            ((token_amount_required * fee_percent) / 10000);

        // Update the recipient's balance
        balances[recipient] += net_amount;

        // Update the total balances in the contract
        total_balances += net_amount;

        // Transfer tokens from the sender to the contract
        SafeERC20.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            token_amount_required
        );

        // Emit the payment event for tracking
        emit Payment(msg.sender, recipient, net_amount, memo, provided_hash);
    }
}
