import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'dotenv/config';

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development network
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    hardhat: {
      chainId: 1337,
    },
    // Ethereum Testnet
    sepolia: {
      url: RPC_URL,
      accounts
    },
    // Ethereum Mainnet
    ethereum: {
      url: RPC_URL,
      accounts
    },
  },
  etherscan:{
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;