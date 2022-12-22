import {
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
  TAX_STRATEGY_IDS,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BytesLike } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ITaxTermsRegistry } from '../../src/contracts/contracts/tax/tax-terms-registry/ITaxTermsRegistry';
import { convertPercentage } from './general';

export const makeTaxTerms = (
  strategyId: BytesLike = EMPTY_BYTES4_DATA_HEX,
  strategyData: BytesLike = EMPTY_BYTES_DATA_HEX,
): ITaxTermsRegistry.TaxTermsStruct => ({
  strategyId,
  strategyData,
});

export const makeTaxTermsFixedRate = (baseTaxRate: string): ITaxTermsRegistry.TaxTermsStruct =>
  makeTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX, encodeFixedRateTaxTerms(baseTaxRate));

export const encodeFixedRateTaxTerms = (baseTaxRate: string): BytesLike =>
  defaultAbiCoder.encode(['uint16'], [convertPercentage(baseTaxRate)]);
