import { hexDataSlice, solidityKeccak256 } from 'ethers/lib/utils';
import { ListingWizard__factory, UniverseWizard__factory, WarperWizard__factory } from './contracts';
import {
  ListingWizardVersion,
  RentalStatus,
  RentalStatusEnum,
  UniverseWizardVersion,
  WarperWizardVersion,
} from './types';

// TODO: use IQ NFT repos exports for this!
export const solidityId = (string: string): string => {
  return hexDataSlice(solidityKeccak256(['string'], [string]), 0, 4);
};

// The `namespace` value must be a correct CAIP-19 asset type namespace.
export const assetClasses = {
  ERC721: { id: solidityId('ERC721'), namespace: 'erc721' }, // id: 0x73ad2146
  ERC20: { id: solidityId('ERC20'), namespace: 'erc20' },
} as const;

export const listingStrategies = {
  FIXED_PRICE: { id: solidityId('FIXED_PRICE'), name: 'FIXED_PRICE' }, // id: 0xce977739
  FIXED_PRICE_WITH_REWARD: { id: solidityId('FIXED_PRICE_WITH_REWARD'), name: 'FIXED_PRICE_WITH_REWARD' }, // 0xa7832972
} as const;

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);

export const listingWizardVersions = new Map([[ListingWizardVersion.V1, ListingWizard__factory]]);
export const universeWizardVersions = new Map([[UniverseWizardVersion.V1, UniverseWizard__factory]]);
export const warperWizardVersions = new Map([[WarperWizardVersion.V1, WarperWizard__factory]]);
