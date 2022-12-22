import {
  BASE_TOKEN_DECIMALS,
  HUNDRED_PERCENT,
  HUNDRED_PERCENT_PRECISION_4,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BigNumberish, ethers, FixedNumber } from 'ethers';

export const convertToWei = (toConvert: string, decimals: number = BASE_TOKEN_DECIMALS): BigNumberish => {
  return ethers.utils.parseUnits(toConvert, decimals);
};

export const calculateBaseRate = (
  expectedForPeriodFee: string,
  periodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): string => {
  return FixedNumber.from(expectedForPeriodFee).divUnsafe(FixedNumber.from(periodInSeconds)).round(decimals).toString();
};

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

export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;
