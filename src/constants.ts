import { ASSET_CLASS_IDS } from '@iqprotocol/iq-space-protocol-light';
import { AssetNamespace, RentalStatus, RentalStatusEnum } from './types';

export const assetClassToNamespaceMap: Map<string, AssetNamespace> = new Map([
  [ASSET_CLASS_IDS.ERC20, 'erc20'],
  [ASSET_CLASS_IDS.ERC721, 'erc721'],
  [ASSET_CLASS_IDS.ERC1155, 'erc1155'],
]);

export const namespaceToAssetClassMap: Map<AssetNamespace, string> = new Map([
  ['erc20', ASSET_CLASS_IDS.ERC20],
  ['erc721', ASSET_CLASS_IDS.ERC721],
  ['erc1155', ASSET_CLASS_IDS.ERC1155],
]);

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);

export const NOMINAL_BATCH_SIZE = 5;
export const NOMINAL_BATCH_GAS_LIMIT = 5n * 1000_000n;
export const BLOCK_GAS_LIMIT = 30n * 1000_000n;
