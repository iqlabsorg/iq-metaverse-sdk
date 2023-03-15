import { EMPTY_BYTES_DATA_HEX } from '@iqprotocol/iq-space-protocol-light';
import { Rentings } from '@iqprotocol/iq-space-protocol-light/typechain';
import { BigNumberish, BytesLike } from 'ethers';
import { AddressTranslator } from '../address-translator';
import { RentingEstimationParams, RentingParams } from '../types';
import { createEmptyListingTerms } from '../utils';

export class RentingHelper {
  static prepareRentingParams(
    params: RentingEstimationParams,
    addressTranslator: AddressTranslator,
  ): Rentings.ParamsStruct {
    const { listingId, paymentToken, rentalPeriod, renter, warper, selectedConfiguratorListingTerms, listingTermsId } =
      params;
    const configuratorListingTerms = selectedConfiguratorListingTerms ?? createEmptyListingTerms();
    return {
      listingId,
      rentalPeriod,
      warper: addressTranslator.assetTypeToAddress(warper),
      renter: addressTranslator.accountIdToAddress(renter),
      paymentToken: addressTranslator.assetTypeToAddress(paymentToken),
      listingTermsId,
      selectedConfiguratorListingTerms: configuratorListingTerms,
    };
  }

  static prepareExtendedRentingParams(
    params: RentingParams,
    addressTranslator: AddressTranslator,
  ): {
    rentingParams: Rentings.ParamsStruct;
    tokenQuote: BytesLike;
    tokenQuoteSignature: BytesLike;
    maxPaymentAmount: BigNumberish;
  } {
    const { maxPaymentAmount, tokenQuote, tokenQuoteSignature } = params;
    return {
      rentingParams: RentingHelper.prepareRentingParams(params, addressTranslator),
      tokenQuote: tokenQuote ?? EMPTY_BYTES_DATA_HEX,
      tokenQuoteSignature: tokenQuoteSignature ?? EMPTY_BYTES_DATA_HEX,
      maxPaymentAmount,
    };
  }
}
