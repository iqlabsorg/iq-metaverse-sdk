import { BigNumber } from '@ethersproject/bignumber';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { taxStrategies } from '../constants';
import { ITaxTermsRegistry } from '../contracts';
import { TaxTermsParams } from '../types';
import { convertPercentage } from '../utils';

export class TaxTermsCoder {
  /**
   * Encodes tax terms.
   * @param params
   */
  static encode(params: TaxTermsParams): ITaxTermsRegistry.TaxTermsStruct {
    const { FIXED_RATE_TAX, FIXED_RATE_TAX_WITH_REWARD } = taxStrategies;

    switch (params.name) {
      case FIXED_RATE_TAX.name:
        return {
          strategyId: FIXED_RATE_TAX.id,
          strategyData: defaultAbiCoder.encode(['uint16'], [convertPercentage(params.data.rate)]),
        };
      case FIXED_RATE_TAX_WITH_REWARD.name:
        return {
          strategyId: FIXED_RATE_TAX_WITH_REWARD.id,
          strategyData: defaultAbiCoder.encode(
            ['uint16', 'uint16'],
            [convertPercentage(params.data.rate), convertPercentage(params.data.rewardRate)],
          ),
        };
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }

  /**
   * Decodes tax terms.
   * @param params
   */
  static decode(params: ITaxTermsRegistry.TaxTermsStruct): TaxTermsParams {
    const { FIXED_RATE_TAX, FIXED_RATE_TAX_WITH_REWARD } = taxStrategies;

    switch (params.strategyId) {
      case FIXED_RATE_TAX.id: {
        const [rate] = defaultAbiCoder.decode(['uint16'], params.strategyData) as [BigNumber];
        return {
          name: FIXED_RATE_TAX.name,
          data: { rate },
        };
      }
      case FIXED_RATE_TAX_WITH_REWARD.id: {
        const [rate, rewardRate] = defaultAbiCoder.decode(['uint16', 'uint16'], params.strategyData) as [
          BigNumber,
          BigNumber,
        ];
        return {
          name: FIXED_RATE_TAX_WITH_REWARD.name,
          data: { rate, rewardRate },
        };
      }
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }
}
