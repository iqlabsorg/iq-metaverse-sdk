import {
  BASE_TOKEN_DECIMALS,
  calculateBaseRateInBaseTokenEthers,
  convertToWei,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
  HUNDRED_PERCENT,
} from '@iqprotocol/solidity-contracts-nft';
import { BigNumberish, FixedNumber } from 'ethers';
import { ListingTerms, TokenQuoteData } from './types';

export const pick = <T extends object, K extends keyof T>(obj: T, names: readonly K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  let idx = 0;
  while (idx < names.length) {
    if (names[idx] in obj) {
      result[names[idx]] = obj[names[idx]];
    }
    idx += 1;
  }
  return result;
};

/**
 * Calculate price per second in Wei
 * @param ethersPerPeriod Price in ethers per period
 * @param periodInSeconds Period length in seconds
 * @param decimals Precision (default = 18)
 * @returns Price per second in Wei
 */
export const calculatePricePerSecondInWei = (
  ethersPerPeriod: string,
  periodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): BigNumberish => {
  return convertToWei(calculateBaseRateInBaseTokenEthers(ethersPerPeriod, periodInSeconds, decimals), decimals);
};

/**
 * Calculcates fixed tax rate in Wei
 * @param ethersPerSecond Price per second in ethers
 * @param taxPercentage Tax rate percentage
 * @param decimals Precision (default = 18)
 * @returns Tax rate in Wei
 */
export const calculateTaxFeeForFixedRateInWei = (
  ethersPerSecond: string,
  taxPercentage: string,
  decimals = BASE_TOKEN_DECIMALS,
): BigNumberish => {
  return convertToWei(
    FixedNumber.from(ethersPerSecond)
      .mulUnsafe(FixedNumber.from(taxPercentage).divUnsafe(FixedNumber.from(HUNDRED_PERCENT)))
      .round(decimals)
      .toString(),
    decimals,
  );
};

export const createEmptyListingTerms = (): ListingTerms => {
  return { strategyId: EMPTY_BYTES4_DATA_HEX, strategyData: EMPTY_BYTES_DATA_HEX };
};

export const createEmptyTokenQuoteData = (): TokenQuoteData => {
  return { tokenQuote: EMPTY_BYTES_DATA_HEX, tokenQuoteSignature: EMPTY_BYTES_DATA_HEX };
};
