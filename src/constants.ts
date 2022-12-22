import {
  ASSET_CLASS,
  LISTING_STRATEGIES,
  LISTING_STRATEGY_IDS,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { RentalStatus, RentalStatusEnum } from './types';

// The `namespace` value must be a correct CAIP-19 asset type namespace.
export const assetClasses = {
  ERC721: { id: ASSET_CLASS.ERC721, namespace: 'erc721' }, // id: 0x73ad2146
  ERC20: { id: ASSET_CLASS.ERC20, namespace: 'erc20' },
} as const;

export const listingStrategies = {
  FIXED_PRICE: { id: LISTING_STRATEGY_IDS.FIXED_RATE, name: LISTING_STRATEGIES.FIXED_RATE }, // id: 0xce977739
  FIXED_PRICE_WITH_REWARD: {
    id: LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
    name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
  }, // 0xa7832972
} as const;

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);
