import { Listings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/listing/listing-manager/ListingManager';
import { Assets } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { BigNumberish } from 'ethers';
import { AddressTranslator } from '../address-translator';
import { AssetCoder } from '../coders';
import { AssetListingParams } from '../types';

export class ListingHelper {
  static prepareListingParams(
    assetListingParams: AssetListingParams,
    addressTranslator: AddressTranslator,
  ): {
    encodedAssets: Assets.AssetStruct[];
    listingParams: Listings.ParamsStruct;
    maxLockPeriod: BigNumberish;
    immediatePayout: boolean;
  } {
    const { assets, params, maxLockPeriod, immediatePayout } = assetListingParams;
    const encodedAssets = assets.map(asset => {
      addressTranslator.assertSameChainId(asset.id.chainId);
      return AssetCoder.encode(asset);
    });
    const listingParams: Listings.ParamsStruct = {
      lister: addressTranslator.accountIdToAddress(params.lister),
      configurator: addressTranslator.accountIdToAddress(params.configurator),
    };

    return { encodedAssets, listingParams, maxLockPeriod, immediatePayout };
  }
}
