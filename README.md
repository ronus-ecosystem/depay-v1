# DePay - Decentralized Payment Solution

DePay is a fully decentralized payment system built to enable trustless transactions between users and vendors directly on the blockchain. This project prioritizes transparency, security, and decentralization by removing any reliance on off-chain servers.

This is **version 1 (v1)** of DePay, created as part of the Ronus.io ecosystem. DePay is designed to streamline decentralized payments, allowing vendors to create payment requests, store funds securely on-chain, and withdraw them at their convenience.

---

## Key Features

- **Fully On-Chain**: Payments are processed and secured entirely on the blockchain, ensuring trustless transactions.
- **Vendor Payment Requests**: Vendors can request payments directly through the smart contract.
- **Secure Fund Management**: Vendor funds are stored in the contract and can be withdrawn at any time.
- **Event Emission**: Each payment emits an event that contains transaction details, enabling backend integration for developers.
- **Dynamic Transaction Fees**: Transaction fees range between **0.04% and 0.4%**, configurable by the DePay service provider.

---

## Use Cases

### **For Vendors**

Vendors can:

- Create decentralized payment requests.
- Store funds securely on the blockchain.
- Withdraw funds whenever needed without intermediaries.

### **For Users**

Users can:

- Make payments directly through the DePay contract.
- Ensure their transactions are secure and verifiable on-chain.

### **For Developers**

Developers can:

- Integrate DePay into their platforms by listening to events emitted by the contract.
- Build custom backend solutions to process payment data and handle events efficiently.

---

## Design Principles

- **No Off-Chain Dependency**:
  DePay operates entirely on-chain, eliminating centralized servers that could introduce single points of failure. This ensures:
  - Transactions are immutable and verifiable.
  - Reduced risk of server-based attacks or downtime.
- **Security First**: The contract is designed with secure algorithms to protect transactions and funds.
- **Developer-Friendly**: While SDKs may be developed in future versions, developers are currently encouraged to handle event parsing and RPC integration independently.

---

## Technical Details

- **Dynamic Transaction Fees**: A fee ranging from **0.04% to 0.4%** is applied to each transaction, adjustable by the service provider.
- **Event Handling**: The contract emits detailed events for every transaction, including:
  - Vendor address
  - Token type
  - Payment amount
  - Optional memo
- **RPC Costs**: Developers must manage their own RPC services, as DePay does not include free RPC access.

---

## Future Development

1. **Whitepaper**:

   - Provide a detailed explanation of DePay’s architecture, rationale, and technical standards.
   - Include diagrams and examples of how DePay interacts with vendors, users, and developers.

2. **SDKs**:

   - Create developer-friendly SDKs for backend integration and event handling.
   - Simplify parsing of emitted events for various programming languages (e.g., JavaScript, Python).

3. **Multi-Chain Support**:
   - Expand DePay to support other EVM-compatible blockchains like Binance Smart Chain (BSC), Polygon, and Avalanche.

---

## Installation

1. Clone the repository and navigate to the project folder:

   ```bash
   git clone https://github.com/your-repo/DePay.git
   cd DePay
   ```

2. Install dependencies and set up environment variables:

   ```bash
   npm install
   cp .env.example .env
   ```

3. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

---

## Deployment Guide

1. **Testnet Deployment**:

- Native
  ```bash
  npm run deploy:native sepolia
  ```

- ERC20
  ```bash
  npm run deploy:erc20 sepolia
  ```

---

## Standard: WT-DP-1
- **WT**: Wilson Tran – Creator.
- **DP**: DePay – Decentralized Payment System.
- **1**: Version 1 – The first iteration of this standard.

---

## License

DePay is licensed under the MIT License. See the LICENSE file for more details.
