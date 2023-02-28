/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC20, ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { writeFile } from 'node:fs/promises';
import { constants, Contract } from 'ethers';
import { hardhatLogger as logger } from '@iqprotocol/iq-space-protocol/tasks/utils/logger';

const UNSAFE_DEPLOYMENT = true;
const addressesOutputFilenamePrefix = '.addresses.json';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const addresses: Map<string, string> = new Map<string, string>();

  // ----- Deploy mock coin ----- //
  const baseToken = (await hre.run('deploy:test:mock:erc20', {
    name: 'Test ERC20',
    symbol: 'ONFT',
    decimals: 18,
    totalSupply: 100_000_000,
    unsafe: UNSAFE_DEPLOYMENT,
  })) as ERC20;
  addresses.set('baseToken', baseToken.address);

  // ----- Deploy Metahub & friends ----- //
  const initialDeploymentAddresses: Record<string, Contract> = await hre.run('deploy:initial-deployment', {
    baseToken: baseToken.address,
    protocolExternalFeesCollector: constants.AddressZero,
    unsafe: UNSAFE_DEPLOYMENT, // Note: not using openzeppelin upgrades plugin
  });
  initialDeploymentAddresses.baseToken = baseToken;

  // ----- Deploy ERC721 token ----- //

  // Deploy an original NFT
  const originalAsset = (await hre.run('deploy:test:mock:erc721', {
    name: 'Test ERC721',
    symbol: 'ONFT',
    unsafe: UNSAFE_DEPLOYMENT,
  })) as ERC721Mock;
  addresses.set('originalAsset', originalAsset.address);
  initialDeploymentAddresses.originalAsset = originalAsset;

  Object.entries(initialDeploymentAddresses).forEach(([name, contract]) => addresses.set(name, contract.address));
  const jsonAddresses = JSON.stringify(Object.fromEntries(addresses), null, 2);
  const fileName = hre.network.name.concat(addressesOutputFilenamePrefix);
  await writeFile(fileName, jsonAddresses);
  logger.info(`Successfully saved IQ Contract addresses to %s`, fileName);
};
export default func;

func.tags = ['test'];
