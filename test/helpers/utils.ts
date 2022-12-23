import {
  BASE_TOKEN_DECIMALS,
  HUNDRED_PERCENT,
  HUNDRED_PERCENT_PRECISION_4,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BigNumber, BigNumberish, ethers, FixedNumber } from 'ethers';
import { AccountId, AssetId, ChainId } from 'caip';

export const toAccountId = (address: string): AccountId => {
  return new AccountId({ chainId: getChainId(), address });
};

export const toAssetId = (collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`eip155:31337/erc721:${collectionAddress}/${tokenId}`);
};

export const getChainId = (): ChainId => {
  return new ChainId({ namespace: 'eip155', reference: '31337' });
};

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

export const COMMON_ID = BigNumber.from(1);
