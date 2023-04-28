import { ListingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AddressTranslator } from '../address-translator';
import { ListingHelper } from '../helpers/listing';
import { ListingParams } from '../types';

export class ListingCoder {
  /**
   * Encode function data for either `createListingWithTerms` or `delegatedCreateListingWithTerms`.
   * @param listing Listing parameters.
   * @param contract Listing wizard contract.
   * @param addressTranslator Address translator.
   */
  static encodeCreateListingWithTermsCall(
    listing: ListingParams,
    contract: ListingWizardV1,
    addressTranslator: AddressTranslator,
  ): string {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      listing.assetListingParams,
      addressTranslator,
    );

    return contract.interface.encodeFunctionData('createListingWithTerms', [
      encodedAssets,
      listingParams,
      listing.listingTerms,
      maxLockPeriod,
      immediatePayout,
      listing.universeId,
    ]);
  }
}
