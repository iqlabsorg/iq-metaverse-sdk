import { BigNumberish, BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { BASE_TOKEN_DECIMALS, EMPTY_BYTES_DATA_HEX, LISTING_STRATEGY_IDS } from '../../src';
import { Listings } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';
import { convertPercentage, convertToWei } from '../../src/utils';
import { IListingTermsRegistry } from '../../src/contracts';
import {
  GlobalListingTermsRegisteredEventFilter,
  UniverseListingTermsRegisteredEventFilter,
  WarperListingTermsRegisteredEventFilter,
} from '@iqprotocol/solidity-contracts-nft/typechain/contracts/listing/listing-terms-registry/IListingTermsRegistry';

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

export const makeListingTermsFixedRateWithReward = (
  baseRate: BigNumberish,
  rewardRatePercent: string,
  baseRateDecimals = BASE_TOKEN_DECIMALS,
): IListingTermsRegistry.ListingTermsStruct =>
  makeListingTerms(
    LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
    encodeFixedRateWithRewardListingTermsData(baseRate, rewardRatePercent, baseRateDecimals),
  );

export const encodeFixedRateWithRewardListingTermsData = (
  baseRate: BigNumberish,
  rewardRatePercent: string,
  baseRateDecimals = BASE_TOKEN_DECIMALS,
): BytesLike =>
  defaultAbiCoder.encode(
    ['uint256', 'uint16'],
    [convertToWei(baseRate.toString(), baseRateDecimals), convertPercentage(rewardRatePercent)],
  );

export const findListingTermsIdByTransaction = async (
  transactionHash: string,
  scope: 'global' | 'universe' | 'warper',
) => {
  const listingTermsRegistry = (await ethers.getContract('ListingTermsRegistry')) as IListingTermsRegistry;
  const tx = await listingTermsRegistry.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  let filter:
    | GlobalListingTermsRegisteredEventFilter
    | UniverseListingTermsRegisteredEventFilter
    | WarperListingTermsRegisteredEventFilter;

  switch (scope) {
    case 'global':
      filter = listingTermsRegistry.filters.GlobalListingTermsRegistered();
      break;
    case 'universe':
      filter = listingTermsRegistry.filters.UniverseListingTermsRegistered();
      break;
    case 'warper':
      filter = listingTermsRegistry.filters.WarperListingTermsRegistered();
      break;
    default:
      filter = listingTermsRegistry.filters.GlobalListingTermsRegistered();
      break;
  }

  const event = (await listingTermsRegistry.queryFilter(filter, tx.blockHash)).find(
    event => event.transactionHash === transactionHash,
  );

  if (!event) {
    return undefined;
  }

  return event.args.listingTermsId;
};
