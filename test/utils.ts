import { ASSET_CLASS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { AccountId, AssetId, ChainId } from 'caip';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { IUniverseRegistry } from '../src/contracts/contracts/universe/universe-registry';
import { Assets, Listings } from '../src/contracts/contracts/listing/listing-manager/ListingManager';

export const toAccountId = (address: string): AccountId => {
  return new AccountId({ chainId: getChainId(), address });
};

export const toAssetId = (collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`eip155:31337/erc721:${collectionAddress}/${tokenId}`);
};

export const getChainId = (): ChainId => {
  return new ChainId({ namespace: 'eip155', reference: '31337' });
};

export const makeListingParams = (
  listerAddress: string,
  configuratorAddress: string = ethers.constants.AddressZero,
): Listings.ParamsStruct => ({
  lister: listerAddress,
  configurator: configuratorAddress,
});

export const makeERC721Asset = (token: string, tokenId: BigNumberish, value: BigNumberish = 1): Assets.AssetStruct => {
  return makeAsset(ASSET_CLASS.ERC721, defaultAbiCoder.encode(['address', 'uint256'], [token, tokenId]), value);
};

export const makeAsset = (assetClass: BytesLike, data: BytesLike, value: BigNumberish): Assets.AssetStruct => {
  return {
    id: { class: assetClass, data },
    value: BigNumber.from(value),
  };
};

export const makeUniverseParams = (name: string, paymentTokens: string[]): IUniverseRegistry.UniverseParamsStruct => ({
  name,
  paymentTokens,
});
