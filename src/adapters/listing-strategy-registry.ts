import { AccountId } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ListingStrategyRegistry } from '../contracts';
import { ListingStrategyConfig } from '../types';

/** @todo: understand if listing and tax strategy IDs should have specific type or just BytesLike */

export class ListingStrategyRegistryAdapter extends Adapter {
  private readonly contract: ListingStrategyRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingStrategyRegistry(accountId.address);
  }

  /**
   * Registers new listing strategy.
   * @param listingStrategyId Listing strategy ID.
   * @param config Listing strategy configuration.
   */
  async registerListingStrategy(
    listingStrategyId: BytesLike,
    config: ListingStrategyConfig,
  ): Promise<ContractTransaction> {
    return this.contract.registerListingStrategy(listingStrategyId, {
      controller: this.accountIdToAddress(config.controller),
      taxStrategyId: config.taxStrategyId,
    });
  }

  /**
   * Sets listing strategy controller.
   * @param listingStrategyId Listing strategy ID.
   * @param controller Listing controller account ID.
   */
  async setListingController(listingStrategyId: BytesLike, controller: AccountId): Promise<ContractTransaction> {
    return this.contract.setListingController(listingStrategyId, this.accountIdToAddress(controller));
  }

  /**
   * Returns listing strategy controller.
   * @param listingStrategyId Listing strategy ID.
   */
  async listingController(listingStrategyId: BytesLike): Promise<AccountId> {
    const controller = await this.contract.listingController(listingStrategyId);
    return this.addressToAccountId(controller);
  }

  /**
   * Returns tax strategy ID for listing strategy.
   * @param listingStrategyId Listing strategy ID.
   */
  async listingTaxId(listingStrategyId: BytesLike): Promise<BytesLike> {
    return this.contract.listingTaxId(listingStrategyId);
  }

  /**
   * Returns listing strategy configuration.
   * @param listingStrategyId Listing strategy ID.
   */
  async listingStrategy(listingStrategyId: BytesLike): Promise<ListingStrategyConfig> {
    const config = await this.contract.listingStrategy(listingStrategyId);
    return {
      controller: this.addressToAccountId(config.controller),
      taxStrategyId: config.taxStrategyId,
    };
  }

  /**
   * Returns tax strategy controller for listing strategy.
   * @param listingStrategyId Listing strategy ID.
   */
  async listingTaxController(listingStrategyId: BytesLike): Promise<AccountId> {
    const controller = await this.contract.listingTaxController(listingStrategyId);
    return this.addressToAccountId(controller);
  }

  /**
   * Checks listing strategy registration.
   * @param listingStrategyId Listing strategy ID.
   */
  async isRegisteredListingStrategy(listingStrategyId: BytesLike): Promise<boolean> {
    return this.contract.isRegisteredListingStrategy(listingStrategyId);
  }
}
