import { BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { AddressTranslator } from '../address-translator';
import { warperPresetMap } from '../constants';
import { ERC721ConfigurablePreset__factory } from '../contracts';
import { WarperPresetIds, WarperPresetInitData } from '../types';

export class WarperPresetCoder {
  static encodePresetId(presetId: WarperPresetIds): BytesLike {
    const encodedPresetId = warperPresetMap.get(presetId);
    if (!encodedPresetId) {
      throw new Error('Invalid warper preset ID');
    }

    return encodedPresetId;
  }

  static encodePresetInitData(presetId: WarperPresetIds, data: WarperPresetInitData): BytesLike {
    if (presetId !== 'ERC721ConfigurablePreset') {
      throw new Error(`Unknown preset ID: "${presetId}"`);
    }

    const { reference } = data.original.assetName;
    AddressTranslator.assertTypeERC721(data.original);

    return ERC721ConfigurablePreset__factory.createInterface().encodeFunctionData('__initialize', [
      defaultAbiCoder.encode(['address', 'address'], [reference, data.metahub.address]),
    ]);
  }
}
