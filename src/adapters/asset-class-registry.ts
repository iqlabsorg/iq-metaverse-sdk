import { AssetClassRegistry } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { AssetClassConfig, AssetNamespace } from '../types';

export class AssetClassRegistryAdapter extends Adapter {
  private readonly contract: AssetClassRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveAssetClassRegistry(accountId.address);
  }

  /**
   * Registers new asset class.
   * @param namespace Asset class namespace.
   * @param config Asset class configuration.
   */
  async registerAssetClass(namespace: AssetNamespace, config: AssetClassConfig): Promise<ContractTransaction> {
    return this.contract.registerAssetClass(this.encodeAssetClass(namespace), {
      vault: this.accountIdToAddress(config.vault),
      controller: this.accountIdToAddress(config.controller),
    });
  }

  /**
   * Sets asset class vault.
   * @param namespace Asset class namespace.
   * @param vault Vault account ID.
   */
  async setAssetClassVault(namespace: AssetNamespace, vault: AccountId): Promise<ContractTransaction> {
    return this.contract.setAssetClassVault(this.encodeAssetClass(namespace), this.accountIdToAddress(vault));
  }

  /**
   * Sets asset class controller.
   * @param namespace Asset class namespace.
   * @param controller Controller account ID.
   */
  async setAssetClassController(namespace: AssetNamespace, controller: AccountId): Promise<ContractTransaction> {
    return this.contract.setAssetClassController(this.encodeAssetClass(namespace), this.accountIdToAddress(controller));
  }

  /**
   * Returns asset class configuration.
   * @param namespace Asset class namespace.
   */
  async assetClassConfig(namespace: AssetNamespace): Promise<AssetClassConfig> {
    const config = await this.contract.assetClassConfig(this.encodeAssetClass(namespace));
    return { vault: this.addressToAccountId(config.vault), controller: this.addressToAccountId(config.controller) };
  }

  /**
   * Checks asset class registration.
   * @param namespace Asset class namespace.
   */
  async isRegisteredAssetClass(namespace: AssetNamespace): Promise<boolean> {
    return this.contract.isRegisteredAssetClass(this.encodeAssetClass(namespace));
  }
}
