import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { IWarperPreset__factory } from '../../src/contracts/factories/contracts/warper/IWarperPreset__factory';

export function getERC721ConfigurablePresetInitData(metahub: string, originalAsset: string): BytesLike {
  return IWarperPreset__factory.createInterface().encodeFunctionData('__initialize', [
    defaultAbiCoder.encode(['address', 'address'], [originalAsset, metahub]),
  ]);
}
