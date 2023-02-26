import { EMPTY_BYTES_DATA_HEX } from '@iqprotocol/iq-space-protocol-light/src/utils/bytes-and-hashing';
import { AccountId } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { rentalStatusMap } from '../constants';
import { ContractResolver } from '../contract-resolver';
import { RentingManager } from '../contracts';
import { Rentings } from '../contracts/contracts/metahub/core/IMetahub';
import { Asset, RentalAgreement, RentalFees, RentalStatus, RentingEstimationParams, RentingParams } from '../types';
import { createEmptyListingTerms, pick } from '../utils';

export class RentingManagerAdapter extends Adapter {
  private readonly contract: RentingManager;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveRentingManager(accountId.address);
  }

  /**
   * Evaluates renting params and returns rental fee breakdown.
   * @param params
   */
  async estimateRent(params: RentingEstimationParams): Promise<RentalFees> {
    const { listingId, paymentToken, rentalPeriod, renter, warper, selectedConfiguratorListingTerms, listingTermsId } =
      params;
    const configuratorListingTerms = selectedConfiguratorListingTerms ?? createEmptyListingTerms();
    const fees = await this.contract.estimateRent({
      listingId,
      rentalPeriod,
      warper: this.assetTypeToAddress(warper),
      renter: this.accountIdToAddress(renter),
      paymentToken: this.assetTypeToAddress(paymentToken),
      selectedConfiguratorListingTerms: configuratorListingTerms,
      listingTermsId,
    });

    return pick(fees, ['total', 'protocolFee', 'listerBaseFee', 'listerPremium', 'universeBaseFee', 'universePremium']);
  }

  /**
   * Performs renting operation.
   * @param params Renting parameters.
   */
  async rent(params: RentingParams): Promise<ContractTransaction> {
    const {
      listingId,
      paymentToken,
      rentalPeriod,
      renter,
      warper,
      maxPaymentAmount,
      selectedConfiguratorListingTerms,
      listingTermsId,
      tokenQuote,
      tokenQuoteSignature,
    } = params;
    const configuratorListingTerms = selectedConfiguratorListingTerms ?? createEmptyListingTerms();
    return this.contract.rent(
      {
        listingId,
        rentalPeriod,
        warper: this.assetTypeToAddress(warper),
        renter: this.accountIdToAddress(renter),
        paymentToken: this.assetTypeToAddress(paymentToken),
        listingTermsId,
        selectedConfiguratorListingTerms: configuratorListingTerms,
      },
      tokenQuote ?? EMPTY_BYTES_DATA_HEX,
      tokenQuoteSignature ?? EMPTY_BYTES_DATA_HEX,
      maxPaymentAmount,
    );
  }

  /**
   * Returns the rental agreement details.
   * @param rentalId Rental agreement ID.
   * @return Rental agreement details.
   */
  async rentalAgreement(rentalId: BigNumberish): Promise<RentalAgreement> {
    const rentalAgreement = await this.contract.rentalAgreementInfo(rentalId);
    return this.normalizeRentalAgreement(rentalId, rentalAgreement);
  }

  /**
   * Returns the number of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @return Rental agreement count.
   */
  async userRentalCount(renter: AccountId): Promise<BigNumber> {
    return this.contract.userRentalCount(this.accountIdToAddress(renter));
  }

  /**
   * Returns the paginated list of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userRentalAgreements(renter: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<RentalAgreement[]> {
    const [rentalIds, agreements] = await this.contract.userRentalAgreements(
      this.accountIdToAddress(renter),
      offset,
      limit,
    );

    return agreements.map((agreement, i) => this.normalizeRentalAgreement(rentalIds[i], agreement));
  }

  /**
   * Returns token amount from specific collection rented by particular account.
   * @param warpedCollectionId Warped collection ID.
   * @param renter Renter account ID.
   */
  async collectionRentedValue(warpedCollectionId: BytesLike, renter: AccountId): Promise<BigNumber> {
    return this.contract.collectionRentedValue(warpedCollectionId, this.accountIdToAddress(renter));
  }

  /**
   * Returns the rental status of a given warped asset.
   * @param asset Asset reference.
   */
  async assetRentalStatus(asset: Asset): Promise<RentalStatus> {
    const encoded = this.encodeAsset(asset);
    const status = await this.contract.assetRentalStatus(encoded.id);
    return this.normalizeRentalStatus(status);
  }

  /**
   * Normalizes rental agreement structure.
   * @param rentalId
   * @param agreement
   * @private
   */
  private normalizeRentalAgreement(rentalId: BigNumberish, agreement: Rentings.AgreementStructOutput): RentalAgreement {
    return {
      ...pick(agreement, ['universeId', 'collectionId', 'listingId', 'startTime', 'endTime']),
      id: BigNumber.from(rentalId),
      warpedAssets: agreement.warpedAssets.map(x => this.decodeAsset(x)),
      renter: this.addressToAccountId(agreement.renter),
      agreementTerms: this.decodeAgreementTerms(agreement.agreementTerms),
    };
  }

  /**
   * Normalizes rental status
   * @param status
   * @private
   */
  private normalizeRentalStatus(status: number): RentalStatus {
    return rentalStatusMap.get(status) ?? 'none';
  }
}
