import { BigNumberish, BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { BASE_TOKEN_DECIMALS, EMPTY_BYTES4_DATA_HEX, EMPTY_BYTES_DATA_HEX, LISTING_STRATEGY_IDS } from '../../src';
import { IListingTermsRegistry } from 'src/contracts/contracts/listing/listing-strategies/ListingController';
import { Listings } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';
import { convertToWei } from '../../src/utils';

export const makeListingParams = (
  listerAddress: string,
  configuratorAddress: string = ethers.constants.AddressZero,
): Listings.ParamsStruct => ({
  lister: listerAddress,
  configurator: configuratorAddress,
});

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

export const getTokenQuoteData = (): { tokenQuote: BytesLike; tokenQuoteSignature: BytesLike } => {
  return { tokenQuote: EMPTY_BYTES_DATA_HEX, tokenQuoteSignature: EMPTY_BYTES_DATA_HEX };
};

export const getSelectedConfiguratorListingTerms = (): { strategyId: BytesLike; strategyData: BytesLike } => {
  return { strategyId: EMPTY_BYTES4_DATA_HEX, strategyData: EMPTY_BYTES_DATA_HEX };
};
