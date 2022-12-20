import { ethers } from 'ethers';
import { Listings } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';

export const makeListingParams = (
  listerAddress: string,
  configuratorAddress: string = ethers.constants.AddressZero,
): Listings.ParamsStruct => ({
  lister: listerAddress,
  configurator: configuratorAddress,
});
