import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { IWarperPresetFactory } from '../../src/contracts';
import { IWarperPreset__factory } from '../../src/contracts/factories/contracts/warper/IWarperPreset__factory';

export function getERC721ConfigurablePresetInitData(metahub: string, originalAsset: string): BytesLike {
  return IWarperPreset__factory.createInterface().encodeFunctionData('__initialize', [
    defaultAbiCoder.encode(['address', 'address'], [originalAsset, metahub]),
  ]);
}

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
