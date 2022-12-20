import { AccountId, AssetId, ChainId } from 'caip';

export const toAccountId = (address: string): AccountId => {
  return new AccountId({ chainId: getChainId(), address });
};

export const toAssetId = (collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`eip155:31337/erc721:${collectionAddress}/${tokenId}`);
};

export const getChainId = (): ChainId => {
  return new ChainId({ namespace: 'eip155', reference: '31337' });
};
