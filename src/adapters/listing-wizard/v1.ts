import { AccountId } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { IListingTermsRegistry, ListingWizardV1 } from '../../contracts';
import { Listings } from '../../contracts/contracts/listing/listing-manager/ListingManager';
import { Assets } from '../../contracts/contracts/metahub/core/IMetahub';
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
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } =
      this.prepareListingParams(assetListingParams);

    return this.contract.createListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
    );
  }

  /**
   * Creates new asset listing (delegated).
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   * @param delegatedListingSignature Delegated Listing ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   */
  async delegatedCreateListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
    delegatedListingSignature: BytesLike,
  ): Promise<ContractTransaction> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } =
      this.prepareListingParams(assetListingParams);

    return this.contract.delegatedCreateListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
      delegatedListingSignature,
    );
  }

  /**
   * Get the current nonce of lister for delegated listing.
   * @param lister Lister account ID.
   */
  async getDelegatedListingCurrentNonce(lister: AccountId): Promise<BigNumber> {
    return this.contract.getDelegatedListingCurrentNonce(this.accountIdToAddress(lister));
  }

  /**
   * Returns the domain separator used in the encoding of the signature for permit, as defined by EIP712.
   */
  async DOMAIN_SEPARATOR(): Promise<string> {
    return this.contract.DOMAIN_SEPARATOR();
  }

  private prepareListingParams(assetListingParams: AssetListingParams): {
    encodedAssets: Assets.AssetStruct[];
    listingParams: Listings.ParamsStruct;
    maxLockPeriod: BigNumberish;
    immediatePayout: boolean;
  } {
    const { assets, params, maxLockPeriod, immediatePayout } = assetListingParams;
    const encodedAssets = assets.map(x => this.encodeAsset(x));
    const listingParams: Listings.ParamsStruct = {
      lister: this.accountIdToAddress(params.lister),
      configurator: this.accountIdToAddress(params.configurator),
    };

    return { encodedAssets, listingParams, maxLockPeriod, immediatePayout };
  }
}
