import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { AssetType } from 'caip';
import { BigNumberish } from 'ethers';
import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { Multiverse } from '../../src';
import { ERC721Mock, IMetahub, IWarperManager, IWarperPresetFactory } from '../../src/contracts';
import { IWarperPreset__factory } from '../../src/contracts/factories/contracts/warper/IWarperPreset__factory';
import { toAccountId } from './caip';

export function getERC721ConfigurablePresetInitData(metahub: string, originalAsset: string): BytesLike {
  return IWarperPreset__factory.createInterface().encodeFunctionData('__initialize', [
    defaultAbiCoder.encode(['address', 'address'], [originalAsset, metahub]),
  ]);
}

export const createAndRegisterWarper = async (
  collection: ERC721Mock,
  multiverse: Multiverse,
  universeId: BigNumberish = 1,
): Promise<AssetType> => {
  const warperPresetFactory = (await ethers.getContract('WarperPresetFactory')) as IWarperPresetFactory;
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;
  const warperManager = (await ethers.getContract('WarperManager')) as IWarperManager;

  const tx = await warperPresetFactory.deployPreset(
    WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
    getERC721ConfigurablePresetInitData(metahub.address, collection.address),
  );

  const wpfAdapter = multiverse.warperPresetFactory(toAccountId(warperPresetFactory.address));
  const warperAddress = await wpfAdapter.findWarperByDeploymentTransaction(tx.hash);

  await warperManager.registerWarper(warperAddress!.assetName.reference!, {
    name: 'Warper',
    universeId,
    paused: false,
  });

  return warperAddress!;
};
