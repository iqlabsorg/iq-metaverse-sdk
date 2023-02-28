import '@iqprotocol/iq-space-protocol/tasks';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
    nftCreator: 1,
    assetOwner: 2,
    operator: 3,
    universeOwner: 4,
    admin: 5,
    supervisor: 6,
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@iqprotocol/iq-space-protocol/artifacts',
        deploy: 'test/deploy',
      },
    ],
  },
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
