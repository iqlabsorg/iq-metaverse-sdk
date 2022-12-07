import { HardhatUserConfig } from 'hardhat/types';
import 'hardhat-deploy';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'tsconfig-paths/register';
// import '@iqprotocol/solidity-contracts-nft/tasks';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  namedAccounts: {
    deployer: 0,
    nftCreator: 1,
    assetOwner: 2,
  },
  paths: {
    sources: './contracts',
    artifacts: './artifacts',
  },
  // external: {
  //   contracts: [{ artifacts: './artifacts', deploy: 'node_modules/@iqprotocol/solidity-contracts-nft/deploy' }],
  // },
  networks: {
    hardhat: {
      chainId: 31337, // explicit default
      live: false,
      saveDeployments: false,
    },
  },
  typechain: {
    outDir: 'src/contracts',
    target: 'ethers-v5',
  },
};

export default config;
