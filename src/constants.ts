import {
  ASSET_CLASS,
  LISTING_STRATEGIES,
  LISTING_STRATEGY_IDS,
  TAX_STRATEGIES,
  TAX_STRATEGY_IDS,
} from '@iqprotocol/solidity-contracts-nft';
import { AssetNamespace, RentalStatus, RentalStatusEnum, WarperPresetId } from './types';
import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft';

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

export const listingStrategies = {
  FIXED_RATE: { id: LISTING_STRATEGY_IDS.FIXED_RATE, name: LISTING_STRATEGIES.FIXED_RATE },
  FIXED_RATE_WITH_REWARD: {
    id: LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
    name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
  },
} as const;

export const taxStrategies = {
  FIXED_RATE_TAX: { id: TAX_STRATEGY_IDS.FIXED_RATE_TAX, name: TAX_STRATEGIES.FIXED_RATE_TAX },
  FIXED_RATE_TAX_WITH_REWARD: {
    id: TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
    name: TAX_STRATEGIES.FIXED_RATE_TAX_WITH_REWARD,
  },
} as const;

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);

export const warperPresetNameToIdMap: Map<WarperPresetId, string> = new Map([
  [WarperPresetId.ERC721_CONFIGURABLE_PRESET, WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET],
]);

export const warperPresetIdToNameMap: Map<string, WarperPresetId> = new Map([
  [WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET, WarperPresetId.ERC721_CONFIGURABLE_PRESET],
]);
