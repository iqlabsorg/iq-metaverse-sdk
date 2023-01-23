import { BigNumber } from 'ethers';
import { defaultAbiCoder, formatEther } from 'ethers/lib/utils';
import { listingStrategies } from '../constants';
import { IListingTermsRegistry } from '../contracts';
import { ListingTerms } from '../types';
import { convertPercentage, convertToPercentage, convertToWei } from '../utils';

export class ListingTermsCoder {
  /**
   * Encodes listing terms.
   */
  static encode(params: ListingTerms): IListingTermsRegistry.ListingTermsStruct {
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

  /**
   * Decodes listing terms.
   */
  static decode(params: IListingTermsRegistry.ListingTermsStruct): ListingTerms {
    const { FIXED_RATE, FIXED_RATE_WITH_REWARD } = listingStrategies;

    switch (params.strategyId) {
      case FIXED_RATE.id: {
        const [pricePerSecondInWei] = defaultAbiCoder.decode(['uint256'], params.strategyData) as [BigNumber];
        return {
          name: FIXED_RATE.name,
          data: {
            pricePerSecondInEthers: formatEther(pricePerSecondInWei),
          },
        };
      }
      case FIXED_RATE_WITH_REWARD.id: {
        const [pricePerSecondInWei, rewardRatePercent] = defaultAbiCoder.decode(
          ['uint256', 'uint16'],
          params.strategyData,
        ) as [BigNumber, BigNumber];
        return {
          name: FIXED_RATE_WITH_REWARD.name,
          data: {
            pricePerSecondInEthers: formatEther(pricePerSecondInWei),
            rewardRatePercent: convertToPercentage(rewardRatePercent),
          },
        };
      }
      default: {
        throw Error('Unrecognized listing strategy');
      }
    }
  }
}
