import { AccountId } from 'caip';
import { BigNumberish } from 'ethers';
import { AddressTranslator } from './address-translator';
import { Asset, AssetNamespace } from './types';

/**
 * Create asset (for on-chain encoding)
 * @param namespace Asset namespace
 * @param assetAccountId Asset account ID
 * @param tokenId Token ID
 * @param value The amount of tokens (always 1 for ERC721)
 * @returns Asset
 */
export const createAsset = (
  namespace: AssetNamespace,
  assetAccountId: AccountId,
  tokenId: string,
  value: BigNumberish = 1,
): Asset => {
  const id = AddressTranslator.createAssetId(assetAccountId, namespace, tokenId);
  return {
    id,
    value,
  };
};
