import { BigNumber } from '@ethersproject/bignumber';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { listingStrategies } from '../constants';
import { IListingTermsRegistry } from '../contracts';
import { ListingStrategyParams } from '../types';

export class ListingStrategyCoder {
  /**
   * Encodes listing strategy params structure.
   * @param params
   */
  static encode(params: ListingStrategyParams): IListingTermsRegistry.ListingTermsStruct {
    const { FIXED_RATE, FIXED_RATE_WITH_REWARD } = listingStrategies;

    switch (params.name) {
      case FIXED_RATE.name:
        return {
          strategyId: FIXED_RATE.id,
          strategyData: defaultAbiCoder.encode(['uint256'], [params.data.price]),
        };
      case FIXED_RATE_WITH_REWARD.name:
        return {
          strategyId: FIXED_RATE_WITH_REWARD.id,
          strategyData: defaultAbiCoder.encode(['uint256', 'uint16'], [params.data.price, params.data.rewardPercent]),
        };
      default: {
        throw Error('Unrecognized listing strategy');
      }
    }
  }

  /**
   * Decodes listing strategy params structure.
   * @param params
   */
  static decode(params: IListingTermsRegistry.ListingTermsStruct): ListingStrategyParams {
    const { FIXED_RATE, FIXED_RATE_WITH_REWARD } = listingStrategies;

    switch (params.strategyId) {
      case FIXED_RATE.id: {
        const [price] = defaultAbiCoder.decode(['uint256'], params.strategyData) as [BigNumber];
        return {
          name: FIXED_RATE.name,
          data: { price },
        };
      }

      case FIXED_RATE_WITH_REWARD.id: {
        const [price, rewardPercent] = defaultAbiCoder.decode(['uint256', 'uint16'], params.strategyData) as [
          BigNumber,
          BigNumber,
        ];
        return {
          name: FIXED_RATE_WITH_REWARD.name,
          data: { price, rewardPercent },
        };
      }

      default: {
        throw Error('Unrecognized listing strategy');
      }
    }
  }
}
