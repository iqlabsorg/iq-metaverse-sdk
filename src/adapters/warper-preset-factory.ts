import { AccountId, AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { IWarperPresetFactory, WarperPresetFactory } from '../contracts';
import { WarperPreset, WarperPresetId, WarperPresetInitData } from '../types';
import { assetClassToNamespace } from '../utils';

export class WarperPresetFactoryAdapter extends Adapter {
  private readonly contract: WarperPresetFactory;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperPresetFactory(accountId.address);
  }

  /**
   * Deploys new instance of warper from preset.
   * @param presetId Name of the warper preset ID.
   * @param data Preset specific configuration.
   */
  async deployPreset(presetId: WarperPresetId, data: WarperPresetInitData): Promise<ContractTransaction> {
    return this.contract.deployPreset(
      this.encodeWarperPresetId(presetId),
      this.encodeWarperPresetInitData(presetId, data),
    );
  }

  /**
   * Retrieves the warper reference from deployment transaction.
   * @param transactionHash
   */
  async findWarperByDeploymentTransaction(transactionHash: string): Promise<AssetType | undefined> {
    const tx = await this.contract.provider.getTransaction(transactionHash);
    if (!tx.blockHash) {
      return undefined;
    }

    const event = (await this.contract.queryFilter(this.contract.filters.WarperPresetDeployed(), tx.blockHash)).find(
      event => event.transactionHash === transactionHash,
    );

    if (!event) {
      return undefined;
    }

    // Fetch warper asset class to assign correct caip-19 namespace.
    const warper = this.contractResolver.resolveWarper(event.args.warper);
    const assetClass = await warper.__assetClass();

    return this.addressToAssetType(event.args.warper, assetClassToNamespace(assetClass));
  }

  /**
   * Returns the warper preset details.
   * @param presetId Name of the warper preset ID.
   */
  async preset(presetId: WarperPresetId): Promise<WarperPreset> {
    const preset = await this.contract.preset(this.encodeWarperPresetId(presetId));
    return this.normalizeWarperPreset(preset);
  }

  /**
   * Returns the list of all registered warper presets.
   */
  async presets() {
    const presets = await this.contract.presets();
    return presets.map(x => this.normalizeWarperPreset(x));
  }

  /**
   * Enables warper preset, which makes it deployable.
   * @param presetId Name of the warper preset ID.
   */
  async enablePreset(presetId: WarperPresetId): Promise<ContractTransaction> {
    return this.contract.enablePreset(this.encodeWarperPresetId(presetId));
  }

  /**
   * Disable warper preset, which makes non-deployable.
   * @param presetId Name of the warper preset ID.
   */
  async disablePreset(presetId: WarperPresetId): Promise<ContractTransaction> {
    return this.contract.disablePreset(this.encodeWarperPresetId(presetId));
  }

  /**
   * Checks whether warper preset is enabled and available for deployment.
   * @param presetId Name of the warper preset ID.
   */
  async presetEnabled(presetId: WarperPresetId): Promise<boolean> {
    return this.contract.presetEnabled(this.encodeWarperPresetId(presetId));
  }

  /**
   * Stores the association between `presetId` and `implementation` address.
   * Warper `implementation` must be deployed beforehand.
   * @param presetId Name of the warper preset ID.
   * @param implementation Warper implementation account ID.
   */
  async addPreset(presetId: WarperPresetId, implementation: AccountId): Promise<ContractTransaction> {
    return this.contract.addPreset(this.encodeWarperPresetId(presetId), this.accountIdToAddress(implementation));
  }

  /**
   * Removes the association between `presetId` and its implementation.
   * @param presetId Name of the warper preset ID.
   */
  async removePreset(presetId: WarperPresetId): Promise<ContractTransaction> {
    return this.contract.removePreset(this.encodeWarperPresetId(presetId));
  }

  private normalizeWarperPreset(preset: IWarperPresetFactory.WarperPresetStructOutput): WarperPreset {
    return {
      id: this.decodeWarperPresetId(preset.id),
      implementation: this.addressToAccountId(preset.implementation),
      enabled: preset.enabled,
    };
  }
}
