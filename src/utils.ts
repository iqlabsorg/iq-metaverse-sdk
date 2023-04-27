import { EMPTY_BYTES4_DATA_HEX, EMPTY_BYTES_DATA_HEX } from '@iqprotocol/iq-space-protocol-light';
import { IListingTermsRegistry } from '@iqprotocol/iq-space-protocol-light/typechain';

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

export const createEmptyListingTerms = (): IListingTermsRegistry.ListingTermsStruct => {
  return { strategyId: EMPTY_BYTES4_DATA_HEX, strategyData: EMPTY_BYTES_DATA_HEX };
};

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
