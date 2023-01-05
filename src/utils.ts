import {
  BASE_TOKEN_DECIMALS,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
  HUNDRED_PERCENT,
  HUNDRED_PERCENT_PRECISION_4,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BigNumberish, BytesLike, ethers, FixedNumber } from 'ethers';
import { assetClasses } from './constants';

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

/** Decodes asset class as a CAIP namespace */
export const assetClassToNamespace = (assetClass: string): string => {
  return Object.values(assetClasses).find(({ id }) => assetClass === id)?.namespace ?? 'unknown';
};

/** Converts value to Wei in specified precision (default = 18) */
export const convertToWei = (toConvert: string, decimals: number = BASE_TOKEN_DECIMALS): BigNumberish => {
  return ethers.utils.parseUnits(toConvert, decimals);
};

/**
 * Calculate price per second in ethers
 * @param ethersPerPeriod Price in ethers per period
 * @param periodInSeconds Period length in seconds
 * @param decimals Precision (default = 18)
 * @returns Price per second in ethers (as a decimal string)
 */
export const calculatePricePerSecondInEthers = (
  ethersPerPeriod: string,
  periodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): string => {
  return FixedNumber.from(ethersPerPeriod).divUnsafe(FixedNumber.from(periodInSeconds)).round(decimals).toString();
};

/** Converts a percentage value to Wei */
export const convertPercentage = (
  percent: BigNumberish,
  hundredPercentWithPrecision: number = HUNDRED_PERCENT_PRECISION_4,
): BigNumberish => {
  return convertToWei(
    FixedNumber.from(percent)
      .mulUnsafe(FixedNumber.from(hundredPercentWithPrecision))
      .divUnsafe(FixedNumber.from(HUNDRED_PERCENT))
      .floor()
      .toString(),
    0,
  );
};

export const createEmptyListingTerms = (): { strategyId: BytesLike; strategyData: BytesLike } => {
  return { strategyId: EMPTY_BYTES4_DATA_HEX, strategyData: EMPTY_BYTES_DATA_HEX };
};
