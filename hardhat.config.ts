import { HardhatUserConfig } from 'hardhat/types';
import 'hardhat-deploy';
import '@iqprotocol/solidity-contracts-nft/tasks';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
  },
  namedAccounts: {
    deployer: 0,
    nftCreator: 1,
    assetOwner: 2,
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@iqprotocol/solidity-contracts-nft/artifacts',
        deploy: 'node_modules/@iqprotocol/solidity-contracts-nft/deploy',
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
