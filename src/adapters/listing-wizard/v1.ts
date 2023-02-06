import { AccountId } from 'caip';
import { BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { IListingTermsRegistry, ListingWizardV1 } from '../../contracts';
import { Listings } from '../../contracts/contracts/listing/listing-manager/ListingManager';
import { AssetListingParams } from '../../types';

export class ListingWizardAdapterV1 extends Adapter {
  private readonly contract: ListingWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingWizardV1(accountId.address);
  }

  /**
   * Creates new asset listing.
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   */
  async createListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<ContractTransaction> {
    const { assets, params, maxLockPeriod, immediatePayout } = assetListingParams;

    const encodedAssets = assets.map(x => this.encodeAsset(x));
    const listingParams: Listings.ParamsStruct = {
      lister: this.accountIdToAddress(params.lister),
      configurator: this.accountIdToAddress(params.configurator),
    };

    return this.contract.createListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
    );
  }
}
