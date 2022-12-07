import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { Metahub } from '../contracts';
import { Listings } from '../contracts/contracts/listing/IListingManager';
import { Rentings } from '../contracts/contracts/metahub/IMetahub';
import {
  AccountBalance,
  Asset,
  BaseToken,
  Listing,
  RentalAgreement,
  RentalFees,
  RentingEstimationParams,
  RentingParams,
} from '../types';
import { assetClassToNamespace, pick } from '../utils';
import { ListingManager } from './../contracts/contracts/listing/ListingManager';
import { RentingManager } from './../contracts/contracts/renting/RentingManager';

export class MetahubAdapter extends Adapter {
  private readonly contract: Metahub;
  private readonly rentingManager: RentingManager;
  private readonly listingManager: ListingManager;

  private constructor(
    metahub: Metahub,
    rentingManager: RentingManager,
    listingManager: ListingManager,
    contractResolver: ContractResolver,
    addressTranslator: AddressTranslator,
  ) {
    super(contractResolver, addressTranslator);
    this.contract = metahub;
    this.rentingManager = rentingManager;
    this.listingManager = listingManager;
  }

  static async create(
    accountId: AccountId,
    contractResolver: ContractResolver,
    addressTranslator: AddressTranslator,
  ): Promise<MetahubAdapter> {
    const metahub = contractResolver.resolveMetahub(accountId.address);

    const rentingManagerAddress = await metahub.getContract(await metahub.RENTING_MANAGER());
    const rentingManager = contractResolver.resolveRentingManager(rentingManagerAddress);

    const listingManagerAddress = await metahub.getContract(await metahub.LISTING_MANAGER());
    const listingManager = contractResolver.resolveListingManager(listingManagerAddress);

    return new MetahubAdapter(metahub, rentingManager, listingManager, contractResolver, addressTranslator);
  }

  // Protocol Configuration
  /**
   * Returns the base token that's used for stable price denomination.
   */
  async baseToken(): Promise<BaseToken> {
    const type = this.addressToAssetType(await this.contract.baseToken(), 'erc20');
    const metadata = await this.erc20AssetMetadata(type);
    return { type, ...metadata };
  }

  // Payment Management

  /**
   * Returns the amount of `token`, currently accumulated by the user.
   * @param account The account to query the balance for.
   * @param token The token in which the balance is nominated.
   * @return Balance of `token`.
   */
  async balance(account: AccountId, token: AssetType): Promise<BigNumber> {
    return this.contract.balance(this.accountIdToAddress(account), this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of user balances in various tokens.
   * @param account The account to query the balance for.
   * @return List of balances.
   */
  async balances(account: AccountId): Promise<AccountBalance[]> {
    const balances = await this.contract.balances(this.accountIdToAddress(account));
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Returns the amount of `token`, currently accumulated by the universe.
   * @param universeId The universe ID.
   * @param token The token address.
   * @return Balance of `token`.
   */
  async universeBalance(universeId: BigNumberish, token: AssetType): Promise<BigNumber> {
    return this.contract.universeBalance(universeId, this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of universe balances in various tokens.
   * @param universeId The universe ID.
   * @return List of balances.
   */
  async universeBalances(universeId: BigNumberish): Promise<AccountBalance[]> {
    const balances = await this.contract.universeBalances(universeId);
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Transfers the specific `amount` of `token` from a user balance to an arbitrary address.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawFunds(token: AssetType, amount: BigNumberish, to: AccountId): Promise<ContractTransaction> {
    return this.contract.withdrawFunds(this.assetTypeToAddress(token), amount, this.accountIdToAddress(to));
  }

  /**
   * Transfers the specific `amount` of `token` from a universe balance to an arbitrary address.
   * @param universeId The universe ID.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawUniverseFunds(
    universeId: BigNumberish,
    token: AssetType,
    amount: BigNumberish,
    to: AccountId,
  ): Promise<ContractTransaction> {
    return this.contract.withdrawUniverseFunds(
      universeId,
      this.assetTypeToAddress(token),
      amount,
      this.accountIdToAddress(to),
    );
  }

  // Asset Management

  /**
   * Returns the number of currently supported assets.
   * @return Asset count.
   */
  async supportedAssetCount(): Promise<BigNumber> {
    return this.contract.supportedAssetCount();
  }

  /**
   * Returns the list of all supported assets.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async supportedAssets(offset: BigNumberish, limit: BigNumberish): Promise<AssetType[]> {
    const [addresses, assetConfigs] = await this.contract.supportedAssets(offset, limit);
    return assetConfigs.map((assetConfig, i) =>
      this.addressToAssetType(addresses[i], assetClassToNamespace(assetConfig.assetClass)),
    );
  }

  /**
   * Checks whether `account` is the `warper` admin.
   * @param warper Warper reference.
   * @param account Admin account ID.
   * @return True if the `account` is the admin of the `warper` and false otherwise.
   */
  async isWarperAdmin(warper: AssetType, account: AccountId): Promise<boolean> {
    return this.contract.isWarperAdmin(this.assetTypeToAddress(warper), this.accountIdToAddress(account));
  }

  // Listing Management

  /**
   * Sets payment token allowance. Allows Metahub to spend specified tokens to cover rental fees.
   * @param paymentToken ERC20 payment token.
   * @param amount Allowance amount.
   */
  async approveForRentalPayment(paymentToken: AssetType, amount: BigNumberish): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .approve(this.contract.address, amount);
  }

  /**
   * Returns current Metahub allowance in specified payment tokens for specific payer account.
   * @param paymentToken ERC20 payment token.
   * @param payer Payer account ID.
   */
  async paymentTokenAllowance(paymentToken: AssetType, payer: AccountId): Promise<BigNumber> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .allowance(this.accountIdToAddress(payer), this.contract.address);
  }

  /**
   * Approves Metahub to take an asset from lister account during listing process.
   * @param asset
   */
  async approveForListing(asset: Asset): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC721(asset.id);
    return this.contractResolver
      .resolveERC721Asset(this.assetIdToAddress(asset.id))
      .approve(this.contract.address, asset.id.tokenId);
  }

  /**
   * Checks whether the asset is approved for listing by the owner.
   * Returns `true` if the asset can be listed, and `false` if the required approval is missing.
   * @param asset
   */
  async isApprovedForListing(asset: Asset): Promise<boolean> {
    AddressTranslator.assertTypeERC721(asset.id);

    // Check particular token allowance.
    const assetContract = this.contractResolver.resolveERC721Asset(this.assetIdToAddress(asset.id));
    //eslint-disable-next-line no-extra-parens
    if ((await assetContract.getApproved(asset.id.tokenId)) === this.contract.address) {
      return true;
    }

    // Check operator.
    const assumedOwner = await this.signerAddress();
    return assetContract.isApprovedForAll(assumedOwner, this.contract.address);
  }

  /**
   * Marks the asset as being delisted. This operation in irreversible.
   * After delisting, the asset can only be withdrawn when it has no active rentals.
   * @param listingId Listing ID.
   */
  async disableListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.disableListing(listingId);
  }

  /**
   * Returns the asset back to the lister.
   * @param listingId Listing ID.
   */
  async withdrawListingAssets(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.withdrawListingAssets(listingId);
  }

  /**
   * Puts the listing on pause.
   * @param listingId Listing ID.
   */
  async pauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.pauseListing(listingId);
  }

  /**
   * Lifts the listing pause.
   * @param listingId Listing ID.
   */
  async unpauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.unpauseListing(listingId);
  }

  /**
   * Returns the listing details by the listing ID.
   * @param listingId Listing ID.
   * @return Listing details.
   */
  async listing(listingId: BigNumberish): Promise<Listing> {
    const listing = await this.listingManager.listingInfo(listingId);
    return this.normalizeListing(listingId, listing);
  }

  /**
   * Returns the number of currently registered listings.
   * @return Listing count.
   */
  async listingCount(): Promise<BigNumber> {
    return this.listingManager.listingCount();
  }

  /**
   * Returns the paginated list of currently registered listings.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async listings(offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.listingManager.listings(offset, limit));
  }

  /**
   * Returns the number of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @return Listing count.
   */
  async userListingCount(lister: AccountId): Promise<BigNumber> {
    return this.listingManager.userListingCount(this.accountIdToAddress(lister));
  }

  /**
   * Returns the paginated list of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userListings(lister: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.listingManager.userListings(this.accountIdToAddress(lister), offset, limit));
  }

  /**
   * Returns the number of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @return Listing count.
   */
  async assetListingCount(asset: AssetType): Promise<BigNumber> {
    return this.listingManager.assetListingCount(this.assetTypeToAddress(asset));
  }

  /**
   * Returns the paginated list of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async assetListings(asset: AssetType, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.normalizeListings(this.listingManager.assetListings(this.assetTypeToAddress(asset), offset, limit));
  }

  // Renting Management

  /**
   * Evaluates renting params and returns rental fee breakdown.
   * @param params
   */
  async estimateRent(params: RentingEstimationParams): Promise<RentalFees> {
    const { listingId, paymentToken, rentalPeriod, renter, warper, selectedConfiguratorListingTerms, listingTermsId } =
      params;
    const fees = await this.rentingManager.estimateRent({
      listingId,
      rentalPeriod,
      warper: this.assetTypeToAddress(warper),
      renter: this.accountIdToAddress(renter),
      paymentToken: this.assetTypeToAddress(paymentToken),
      selectedConfiguratorListingTerms,
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
    return this.rentingManager.rent(
      {
        listingId,
        rentalPeriod,
        warper: this.assetTypeToAddress(warper),
        renter: this.accountIdToAddress(renter),
        paymentToken: this.assetTypeToAddress(paymentToken),
        listingTermsId,
        selectedConfiguratorListingTerms,
      },
      tokenQuote,
      tokenQuoteSignature,
      maxPaymentAmount,
    );
  }

  /**
   * Returns the rental agreement details.
   * @param rentalId Rental agreement ID.
   * @return Rental agreement details.
   */
  async rentalAgreement(rentalId: BigNumberish): Promise<RentalAgreement> {
    const rentalAgreement = await this.rentingManager.rentalAgreementInfo(rentalId);
    return this.normalizeRentalAgreement(rentalId, rentalAgreement);
  }

  /**
   * Returns the number of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @return Rental agreement count.
   */
  async userRentalCount(renter: AccountId): Promise<BigNumber> {
    return this.rentingManager.userRentalCount(this.accountIdToAddress(renter));
  }

  /**
   * Returns the paginated list of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userRentalAgreements(renter: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<RentalAgreement[]> {
    const [rentalIds, agreements] = await this.rentingManager.userRentalAgreements(
      this.accountIdToAddress(renter),
      offset,
      limit,
    );

    return agreements.map((agreement, i) => this.normalizeRentalAgreement(rentalIds[i], agreement));
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
