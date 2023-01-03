import { AccountId } from 'caip';
import { BigNumber, BigNumberish } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ListingTermsRegistry } from '../contracts';
import { ListingTermsInfo } from '../types';

export class ListingTermsRegistryAdapter extends Adapter {
  private readonly contract: ListingTermsRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingTermsRegistry(accountId.address);
  }

  /**
   * Returns listing terms details by the listing terms ID.
   * @param listingTermsId Listing terms ID.
   * @return Listing terms details.
   */
  async listingTerms(listingTermsId: BigNumberish): Promise<ListingTermsInfo> {
    const terms = await this.contract.listingTerms(listingTermsId);
    return { ...terms, id: BigNumber.from(listingTermsId) };
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
}
