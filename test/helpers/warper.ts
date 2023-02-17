import { ethers } from 'hardhat';
import { IWarperPresetFactory } from '../../src/contracts';

export const findWarperByDeploymentTransaction = async (transactionHash: string) => {
  const warperPresetFactory = (await ethers.getContract('WarperPresetFactory')) as IWarperPresetFactory;
  const tx = await warperPresetFactory.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  const event = (
    await warperPresetFactory.queryFilter(warperPresetFactory.filters.WarperPresetDeployed(), tx.blockHash)
  ).find(event => event.transactionHash === transactionHash);

  if (!event) {
    return undefined;
  }

  return event.args.warper;
};
