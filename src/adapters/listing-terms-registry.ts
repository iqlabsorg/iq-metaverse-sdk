import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { IListingTermsRegistry, ListingTermsRegistry } from '../contracts';
import { ListingTermsInfo, ListingTermsInfoWithParams, ListingTermsQueryParams } from '../types';

export class ListingTermsRegistryAdapter extends Adapter {
  private readonly contract: ListingTermsRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingTermsRegistry(accountId.address);
  }

  /**
   * Returns listing terms details by the listing terms ID.
   * @param listingTermsId Listing terms ID.
   */
  async listingTerms(listingTermsId: BigNumberish): Promise<ListingTermsInfo> {
    const terms = await this.contract.listingTerms(listingTermsId);
    return { strategyId: terms.strategyId, strategyData: terms.strategyData, id: BigNumber.from(listingTermsId) };
  }

  /**
   * Returns listing terms details with additional parameters by the listing terms ID.
   * @param listingTermsId Listing terms ID.
   */
  async listingTermsWithParams(listingTermsId: BigNumberish): Promise<ListingTermsInfoWithParams> {
    const [terms, params] = await this.contract.listingTermsWithParams(listingTermsId);
    return {
      strategyId: terms.strategyId,
      strategyData: terms.strategyData,
      id: BigNumber.from(listingTermsId),
      universeId: params.universeId,
      listingId: params.listingId,
      warper: this.addressToAssetType(params.warperAddress, 'erc721'),
    };
  }

  /**
   * Returns all listing terms for a given listing.
   * @param queryParams Query parameters.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async allListingTerms(
    queryParams: ListingTermsQueryParams,
    offset: BigNumberish,
    limit: BigNumberish,
  ): Promise<ListingTermsInfo[]> {
    const infos: ListingTermsInfo[] = [];

    const { listingTermsIds, listingTermsList } = await this.contract.allListingTerms(
      {
        listingId: queryParams.listingId,
        universeId: queryParams.universeId,
        warperAddress: this.assetTypeToAddress(queryParams.warper),
      },
      offset,
      limit,
    );

    listingTermsIds.forEach((id, index) => {
      const terms = listingTermsList[index];
      infos.push({ strategyId: terms.strategyId, strategyData: terms.strategyData, id });
    });

    return infos;
  }

  /**
   * Retrieves listing terms ID from registration transaction.
   * @param transactionHash
   */
  async findListingTermsIdByCreationTransaction(transactionHash: string): Promise<BigNumber | null> {
    const tx = await this.contract.provider.getTransaction(transactionHash);
    if (!tx.blockHash) {
      return null;
    }

    const event = (await this.contract.queryFilter(this.contract.filters.ListingTermsRegistered(), tx.blockHash)).find(
      event => event.transactionHash === transactionHash,
    );

    if (!event) {
      return null;
    }

    return event.args.listingTermsId;
  }

  /**
   * Retrieves listing terms details from registration transaction.
   * @param transactionHash
   */
  async findListingTermsByCreationTransaction(transactionHash: string): Promise<ListingTermsInfo | null> {
    const termsId = await this.findListingTermsIdByCreationTransaction(transactionHash);

    if (!termsId) {
      return null;
    }

    return this.listingTerms(termsId);
  }

  /**
   * Registers global listing terms.
   * @param listingId Listing ID.
   * @param listingTerms Listing terms.
   */
  async registerGlobalListingTerms(
    listingId: BigNumberish,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerGlobalListingTerms(listingId, listingTerms);
  }

  /**
   * Removes global listing terms.
   * @param listingId Listing ID.
   * @param listingTermsId Listing Terms ID.
   */
  async removeGlobalListingTerms(listingId: BigNumberish, listingTermsId: BigNumberish): Promise<ContractTransaction> {
    return this.contract.removeGlobalListingTerms(listingId, listingTermsId);
  }

  /**
   * Registers universe listing terms.
   * @param listingId Listing ID.
   * @param universeId Universe ID.
   * @param terms Listing terms.
   */
  async registerUniverseListingTerms(
    listingId: BigNumberish,
    universeId: BigNumberish,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerUniverseListingTerms(listingId, universeId, listingTerms);
  }

  /**
   * Removes universe listing terms.
   * @param listingId Listing ID.
   * @param universeId Universe ID.
   * @param listingTermsId Listing Terms ID.
   */
  async removeUniverseListingTerms(
    listingId: BigNumberish,
    universeId: BigNumberish,
    listingTermsId: BigNumberish,
  ): Promise<ContractTransaction> {
    return this.contract.removeUniverseListingTerms(listingId, universeId, listingTermsId);
  }

  /**
   * Registers warper listing terms.
   * @param listingId Listing ID.
   * @param warper Warper reference.
   * @param listingTerms Listing terms.
   */
  async registerWarperListingTerms(
    listingId: BigNumberish,
    warper: AssetType,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerWarperListingTerms(listingId, this.assetTypeToAddress(warper), listingTerms);
  }

  /**
   * Removes warper listing terms.
   * @param listingId Listing ID.
   * @param warper Warper reference.
   * @param listingTermsId Listing Terms ID.
   */
  async removeWarperListingTerms(
    listingId: BigNumberish,
    warper: AssetType,
    listingTermsId: BigNumberish,
  ): Promise<ContractTransaction> {
    return this.contract.removeWarperListingTerms(listingId, this.assetTypeToAddress(warper), listingTermsId);
  }

  /**
   * Checks registration of listing terms.
   * @param listingTermsId Listing Terms ID.
   */
  async areRegisteredListingTerms(listingTermsId: BigNumberish): Promise<boolean> {
    return this.contract.areRegisteredListingTerms(listingTermsId);
  }

  /**
   * Checks registration of listing terms.
   * @param listingTermsId Listing Terms ID.
   * @param queryParams Query parameters.
   */
  async areRegisteredListingTermsWithParams(
    listingTermsId: BigNumberish,
    queryParams: ListingTermsQueryParams,
  ): Promise<boolean> {
    return this.contract.areRegisteredListingTermsWithParams(listingTermsId, {
      listingId: queryParams.listingId,
      universeId: queryParams.universeId,
      warperAddress: this.assetTypeToAddress(queryParams.warper),
    });
  }
}
