import { BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { AddressTranslator } from '../address-translator';
import { warperPresetIdToNameMap, warperPresetNameToIdMap } from '../constants';
import { ERC721ConfigurablePreset__factory } from '../contracts';
import { WarperPresetId, WarperPresetInitData } from '../types';

export class WarperPresetCoder {
  /**
   * Encode warper preset ID.
   * @param presetId Name of the warper preset ID.
   */
  static encodePresetId(presetId: WarperPresetId): BytesLike {
    const encodedPresetId = warperPresetNameToIdMap.get(presetId);
    if (!encodedPresetId) {
      throw new Error('Invalid warper preset ID');
    }

    return encodedPresetId;
  }

  /**
   * Decodes warper preset ID.
   * @param presetId Warper preset ID.
   */
  static decodePresetId(presetId: BytesLike): WarperPresetId {
    const decodedPresetId = warperPresetIdToNameMap.get(presetId.toString());
    if (!decodedPresetId) {
      throw new Error('Invalid warper preset ID');
    }

    return decodedPresetId;
  }

  /**
   * Encode warper preset init data.
   * @param presetId Name of the warper preset ID.
   * @param data Warper init data.
   */
  static encodePresetInitData(presetId: WarperPresetId, data: WarperPresetInitData): BytesLike {
    if (presetId !== WarperPresetId.ERC721_CONFIGURABLE_PRESET) {
      throw new Error(`Unknown preset ID: "${presetId}"`);
    }

    const { reference } = data.original.assetName;
    AddressTranslator.assertTypeERC721(data.original);

    return ERC721ConfigurablePreset__factory.createInterface().encodeFunctionData('__initialize', [
      defaultAbiCoder.encode(['address', 'address'], [reference, data.metahub.address]),
    ]);
  }
}
