import { AccountId, AssetId, ChainId } from 'caip';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { calculatePricePerSecondInEthers } from '../../src';
import { hexDataSlice, id } from 'ethers/lib/utils';

export const toAccountId = (address: string): AccountId => {
  return new AccountId({ chainId: getChainId(), address });
};

export const toAssetId = (collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`eip155:31337/erc721:${collectionAddress}/${tokenId}`);
};

export const getChainId = (): ChainId => {
  return new ChainId({ namespace: 'eip155', reference: '31337' });
};

export const mineBlock = async (timestamp = 0): Promise<unknown> => {
  return ethers.provider.send('evm_mine', timestamp > 0 ? [timestamp] : []);
};

export const latestBlockTimestamp = async (): Promise<number> => {
  return (await ethers.provider.getBlock('latest')).timestamp;
};

export const waitBlockchainTime = async (seconds: number): Promise<void> => {
  const time = await latestBlockTimestamp();
  await mineBlock(time + seconds);
};

/**
 * Calculates ID by taking 4 byte of the provided string hashed value.
 * @param string Arbitrary string.
 */
export const solidityIdBytes4 = (string: string): string => {
  return hexDataSlice(solidityIdBytes32(string), 0, 4);
};

/**
 * Calculates ID for bytes32 string.
 * @param string Arbitrary string.
 */
export const solidityIdBytes32 = (string: string): string => {
  return id(string);
};

export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;

export const COMMON_ID = BigNumber.from(1);
export const COMMON_PRICE = '10';
export const COMMON_TAX_RATE = '2.25';
export const COMMON_REWARD_RATE = '0.5';
export const COMMON_BASE_RATE = calculatePricePerSecondInEthers(COMMON_PRICE, SECONDS_IN_DAY);
