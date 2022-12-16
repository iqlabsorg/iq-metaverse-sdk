import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { Listings } from '../contracts/contracts/metahub/core/IMetahub';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ListingManager } from '../contracts';
import { Listing } from '../types';
import { pick } from '../utils';

export class ListingManagerAdapter extends Adapter {
  private readonly contract: ListingManager;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingManager(accountId.address);
  }

  /**
   * Marks the asset as being delisted. This operation in irreversible.
   * After delisting, the asset can only be withdrawn when it has no active rentals.
   * @param listingId Listing ID.
   */
  async disableListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.contract.disableListing(listingId);
  }

  /**
   * Returns the asset back to the lister.
   * @param listingId Listing ID.
   */
  async withdrawListingAssets(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.contract.withdrawListingAssets(listingId);
  }

  /**
   * Puts the listing on pause.
   * @param listingId Listing ID.
   */
  async pauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.contract.pauseListing(listingId);
  }

  /**
   * Lifts the listing pause.
   * @param listingId Listing ID.
   */
  async unpauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.contract.unpauseListing(listingId);
  }

  /**
   * Returns the listing details by the listing ID.
   * @param listingId Listing ID.
   * @return Listing details.
   */
  async listing(listingId: BigNumberish): Promise<Listing> {
    const listing = await this.contract.listingInfo(listingId);
    return this.normalizeListing(listingId, listing);
  }

  /**
   * Returns the number of currently registered listings.
   * @return Listing count.
   */
  async listingCount(): Promise<BigNumber> {
    return this.contract.listingCount();
  }

  /**
   * Returns the paginated list of currently registered listings.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async listings(offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.contract.listings(offset, limit));
  }

  /**
   * Returns the number of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @return Listing count.
   */
  async userListingCount(lister: AccountId): Promise<BigNumber> {
    return this.contract.userListingCount(this.accountIdToAddress(lister));
  }

  /**
   * Returns the paginated list of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userListings(lister: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.contract.userListings(this.accountIdToAddress(lister), offset, limit));
  }

  /**
   * Returns the number of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @return Listing count.
   */
  async assetListingCount(asset: AssetType): Promise<BigNumber> {
    return this.contract.assetListingCount(this.assetTypeToAddress(asset));
  }

  /**
   * Returns the paginated list of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async assetListings(asset: AssetType, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.contract.assetListings(this.assetTypeToAddress(asset), offset, limit));
  }

  /**
   * Resolves listings and normalizes them.
   * @param listingsRequest
   * @private
   */
  private async normalizeListings(
    listingsRequest: Promise<[BigNumber[], Listings.ListingStructOutput[]]>,
  ): Promise<Listing[]> {
    const [listingIds, listings] = await listingsRequest;
    return listings.map((listing, i) => this.normalizeListing(listingIds[i], listing));
  }

  /**
   * Normalizes listing structure.
   * @param listingId
   * @param listing
   * @private
   */
  private normalizeListing(listingId: BigNumberish, listing: Listings.ListingStructOutput): Listing {
    return {
      ...pick(listing, ['maxLockPeriod', 'lockedTill', 'immediatePayout', 'enabled', 'paused']),
      id: BigNumber.from(listingId),
      assets: listing.assets.map(x => this.decodeAsset(x)),
      lister: this.addressToAccountId(listing.lister),
      configurator: this.addressToAccountId(listing.configurator),
      beneficiary: this.addressToAccountId(listing.beneficiary),
    };
  }
}
