import { defaultAbiCoder } from 'ethers/lib/utils';
import { listingStrategies } from '../constants';
import { IListingTermsRegistry } from '../contracts';
import { ListingTermsParams } from '../types';
import { convertPercentage, convertToWei } from '../utils';

export class ListingTermsCoder {
  /**
   * Encodes listing terms.
   * @param params
   */
  static encode(params: ListingTermsParams): IListingTermsRegistry.ListingTermsStruct {
    const { FIXED_RATE, FIXED_RATE_WITH_REWARD } = listingStrategies;

    switch (params.name) {
      case FIXED_RATE.name:
        return {
          strategyId: FIXED_RATE.id,
          strategyData: defaultAbiCoder.encode(
            ['uint256'],
            [convertToWei(params.data.pricePerSecondInEthers.toString())],
          ),
        };
      case FIXED_RATE_WITH_REWARD.name:
        return {
          strategyId: FIXED_RATE_WITH_REWARD.id,
          strategyData: defaultAbiCoder.encode(
            ['uint256', 'uint16'],
            [
              convertToWei(params.data.pricePerSecondInEthers.toString()),
              convertPercentage(params.data.rewardRatePercent),
            ],
          ),
        };
      default: {
        throw Error('Unrecognized listing strategy');
      }
    }
  }
}
