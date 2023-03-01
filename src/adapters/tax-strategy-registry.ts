import { TaxStrategyRegistry } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { TaxStrategyConfig } from '../types';

export class TaxStrategyRegistryAdapter extends Adapter {
  private readonly contract: TaxStrategyRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveTaxStrategyRegistry(accountId.address);
  }

  /**
   * Registers new tax strategy.
   * @param taxStrategyId Tax strategy ID.
   * @param config Tax strategy configuration.
   */
  async registerTaxStrategy(taxStrategyId: BytesLike, config: TaxStrategyConfig): Promise<ContractTransaction> {
    return this.contract.registerTaxStrategy(taxStrategyId, {
      controller: this.accountIdToAddress(config.controller),
    });
  }

  /**
   * Sets tax strategy controller.
   * @param taxStrategyId Tax strategy ID.
   * @param controller Tax controller account ID.
   */
  async setTaxController(taxStrategyId: BytesLike, controller: AccountId): Promise<ContractTransaction> {
    return this.contract.setTaxController(taxStrategyId, this.accountIdToAddress(controller));
  }

  /**
   * Returns tax strategy controller.
   * @param taxStrategyId Tax strategy ID.
   */
  async taxController(taxStrategyId: BytesLike): Promise<AccountId> {
    const controller = await this.contract.taxController(taxStrategyId);
    return this.addressToAccountId(controller);
  }

  /**
   * Returns tax strategy configuration.
   * @param taxStrategyId Tax strategy ID.
   */
  async taxStrategy(taxStrategyId: BytesLike): Promise<TaxStrategyConfig> {
    const config = await this.contract.taxStrategy(taxStrategyId);
    return {
      controller: this.addressToAccountId(config.controller),
    };
  }

  /**
   * Checks tax strategy registration.
   * @param taxStrategyId Tax strategy ID.
   */
  async isRegisteredTaxStrategy(taxStrategyId: BytesLike): Promise<boolean> {
    return this.contract.isRegisteredTaxStrategy(taxStrategyId);
  }
}
