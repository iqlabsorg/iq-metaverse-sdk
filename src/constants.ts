import { ASSET_CLASS } from '@iqprotocol/solidity-contracts-nft';
import { AssetNamespace, RentalStatus, RentalStatusEnum } from './types';

export const assetClassToNamespaceMap: Map<string, AssetNamespace> = new Map([
  [ASSET_CLASS.ERC20, 'erc20'],
  [ASSET_CLASS.ERC721, 'erc721'],
  [ASSET_CLASS.ERC1155, 'erc1155'],
]);

export const namespaceToAssetClassMap: Map<AssetNamespace, string> = new Map([
  ['erc20', ASSET_CLASS.ERC20],
  ['erc721', ASSET_CLASS.ERC721],
  ['erc1155', ASSET_CLASS.ERC1155],
]);

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);
