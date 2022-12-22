import { BASE_TOKEN_DECIMALS, LISTING_STRATEGY_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish, BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { IListingTermsRegistry } from 'src/contracts/contracts/listing/listing-strategies/ListingController';
import { IListingManager } from '../../src/contracts';
import { Assets, Listings } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';
import { convertToWei, SECONDS_IN_DAY } from './general';

export const makeListingParams = (
  listerAddress: string,
  configuratorAddress: string = ethers.constants.AddressZero,
): Listings.ParamsStruct => ({
  lister: listerAddress,
  configurator: configuratorAddress,
});

export const createListing = async (lister: SignerWithAddress, listingAssets: Assets.AssetStruct[]): Promise<void> => {
  const listingManager = (await ethers.getContract('ListingManager')) as IListingManager;
  await listingManager
    .connect(lister)
    .createListing(listingAssets, makeListingParams(lister.address), SECONDS_IN_DAY * 7, true);
};

export const makeListingTerms = (
  strategyId: BytesLike,
  strategyData: BytesLike,
): IListingTermsRegistry.ListingTermsStruct => ({
  strategyId,
  strategyData,
});

export const makeListingTermsFixedRate = (
  baseRate: BigNumberish,
  decimals = BASE_TOKEN_DECIMALS,
): IListingTermsRegistry.ListingTermsStruct =>
  makeListingTerms(LISTING_STRATEGY_IDS.FIXED_RATE, encodeFixedRateListingTermsData(baseRate, decimals));

export const encodeFixedRateListingTermsData = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): BytesLike =>
  defaultAbiCoder.encode(['uint256'], [convertToWei(baseRate.toString(), decimals)]);
