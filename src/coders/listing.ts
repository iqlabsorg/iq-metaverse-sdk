import { ListingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AddressTranslator } from '../address-translator';
import { ListingHelper } from '../helpers/listing';
import { CreateListingParams } from '../types';

export class ListingCoder {
  static encodeCreateListingWithTermsCall(
    listing: CreateListingParams,
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
