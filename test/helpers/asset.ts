import { ASSET_CLASS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BigNumber, BigNumberish } from 'ethers';
import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';

import { Assets } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';

export const makeERC721Asset = (token: string, tokenId: BigNumberish, value: BigNumberish = 1): Assets.AssetStruct => {
  return makeAsset(ASSET_CLASS.ERC721, defaultAbiCoder.encode(['address', 'uint256'], [token, tokenId]), value);
};

export const makeAsset = (assetClass: BytesLike, data: BytesLike, value: BigNumberish): Assets.AssetStruct => {
  return {
    id: { class: assetClass, data },
    value: BigNumber.from(value),
  };
};
