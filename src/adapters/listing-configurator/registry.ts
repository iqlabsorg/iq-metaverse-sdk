import { AccountId } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { ListingConfiguratorRegistry } from '../../contracts';

export class ListingConfiguratorRegistryAdapter extends Adapter {
  private readonly contract: ListingConfiguratorRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingConfiguratorRegistry(accountId.address);
  }

  /**
   * Registers listing configurator (must be deployed and configured prior to registration).
   * @param configurator Configurator account ID.
   * @param admin Admin account ID.
   */
  async registerListingConfigurator(configurator: AccountId, admin: AccountId): Promise<ContractTransaction> {
    return this.contract.registerListingConfigurator(
      this.accountIdToAddress(configurator),
      this.accountIdToAddress(admin),
    );
  }

  /**
   * Sets configurator controller.
   * @param controller Controller account ID.
   */
  async setController(controller: AccountId): Promise<ContractTransaction> {
    return this.contract.setController(this.accountIdToAddress(controller));
  }

  /**
   * Returns configurator controller.
   * @param configurator Configurator account ID.
   */
  async getController(configurator: AccountId): Promise<AccountId> {
    const controller = await this.contract.getController(this.accountIdToAddress(configurator));
    return this.addressToAccountId(controller);
  }
}
