import { defaultAbiCoder } from 'ethers/lib/utils';
import { taxStrategies } from '../constants';
import { ITaxTermsRegistry } from '../contracts';
import { TaxTermsParams } from '../types';
import { convertPercentageToWei } from '../utils';

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
          strategyData: defaultAbiCoder.encode(['uint16'], [convertPercentageToWei(params.data.ratePercent)]),
        };
      case FIXED_RATE_TAX_WITH_REWARD.name:
        return {
          strategyId: FIXED_RATE_TAX_WITH_REWARD.id,
          strategyData: defaultAbiCoder.encode(
            ['uint16', 'uint16'],
            [convertPercentageToWei(params.data.ratePercent), convertPercentageToWei(params.data.rewardRatePercent)],
          ),
        };
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }
}
