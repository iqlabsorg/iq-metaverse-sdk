import { BigNumber } from 'ethers';
import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { taxStrategies } from '../constants';
import { ITaxTermsRegistry } from '../contracts';
import { TaxTerms, TaxTermsStrategyIdName } from '../types';
import { convertPercentage, convertToPercentage } from '../utils';

export class TaxTermsCoder {
  /**
   * Encodes tax terms.
   */
  static encode(params: TaxTerms): ITaxTermsRegistry.TaxTermsStruct {
    const { FIXED_RATE_TAX, FIXED_RATE_TAX_WITH_REWARD } = taxStrategies;

    switch (params.name) {
      case FIXED_RATE_TAX.name:
        return {
          strategyId: FIXED_RATE_TAX.id,
          strategyData: defaultAbiCoder.encode(['uint16'], [convertPercentage(params.data.ratePercent)]),
        };
      case FIXED_RATE_TAX_WITH_REWARD.name:
        return {
          strategyId: FIXED_RATE_TAX_WITH_REWARD.id,
          strategyData: defaultAbiCoder.encode(
            ['uint16', 'uint16'],
            [convertPercentage(params.data.ratePercent), convertPercentage(params.data.rewardRatePercent)],
          ),
        };
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }

  /**
   * Encodes tax strategy ID.
   * @param taxStrategyIdName Name of the tax stragey ID.
   */
  static encodeTaxStrategyId(taxStrategyIdName: TaxTermsStrategyIdName): BytesLike {
    const { FIXED_RATE_TAX, FIXED_RATE_TAX_WITH_REWARD } = taxStrategies;

    switch (taxStrategyIdName) {
      case FIXED_RATE_TAX.name:
        return FIXED_RATE_TAX.id;
      case FIXED_RATE_TAX_WITH_REWARD.name:
        return FIXED_RATE_TAX_WITH_REWARD.id;
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }

  /**
   * Decodes tax terms.
   */
  static decode(params: ITaxTermsRegistry.TaxTermsStruct): TaxTerms {
    const { FIXED_RATE_TAX, FIXED_RATE_TAX_WITH_REWARD } = taxStrategies;

    switch (params.strategyId) {
      case FIXED_RATE_TAX.id: {
        const [ratePercent] = defaultAbiCoder.decode(['uint16'], params.strategyData) as [BigNumber];
        return {
          name: FIXED_RATE_TAX.name,
          data: {
            ratePercent: convertToPercentage(ratePercent),
          },
        };
      }
      case FIXED_RATE_TAX_WITH_REWARD.id: {
        const [ratePercent, rewardRatePercent] = defaultAbiCoder.decode(['uint16', 'uint16'], params.strategyData) as [
          BigNumber,
          BigNumber,
        ];
        return {
          name: FIXED_RATE_TAX_WITH_REWARD.name,
          data: {
            ratePercent: convertToPercentage(ratePercent),
            rewardRatePercent: convertToPercentage(rewardRatePercent),
          },
        };
      }
      default: {
        throw Error('Unrecognized tax strategy');
      }
    }
  }
}
