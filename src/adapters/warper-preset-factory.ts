import { IWarperPresetFactory, WarperPresetFactory } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId, AssetType } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { WarperPreset } from '../types';

export class WarperPresetFactoryAdapter extends Adapter {
  private readonly contract: WarperPresetFactory;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperPresetFactory(accountId.address);
  }

  /**
   * Deploys new instance of warper from preset.
   * @param presetId Warper preset ID.
   * @param initData Preset initialization data.
   */
  async deployPreset(presetId: BytesLike, initData: BytesLike): Promise<ContractTransaction> {
    return this.contract.deployPreset(presetId, initData);
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

    return this.addressToAssetType(event.args.warper, this.decodeAssetClass(assetClass));
  }

  /**
   * Returns the warper preset details.
   * @param presetId Warper preset ID.
   */
  async preset(presetId: BytesLike): Promise<WarperPreset> {
    const preset = await this.contract.preset(presetId);
    return this.normalizeWarperPreset(preset);
  }

  /**
   * Returns the list of all registered warper presets.
   */
  async presets(): Promise<WarperPreset[]> {
    const presets = await this.contract.presets();
    return presets.map(x => this.normalizeWarperPreset(x));
  }

  /**
   * Enables warper preset, which makes it deployable.
   * @param presetId Warper preset ID.
   */
  async enablePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.enablePreset(presetId);
  }

  /**
   * Disable warper preset, which makes non-deployable.
   * @param presetId Warper preset ID.
   */
  async disablePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.disablePreset(presetId);
  }

  /**
   * Checks whether warper preset is enabled and available for deployment.
   * @param presetId Warper preset ID.
   */
  async presetEnabled(presetId: BytesLike): Promise<boolean> {
    return this.contract.presetEnabled(presetId);
  }

  /**
   * Stores the association between `presetId` and `implementation` address.
   * Warper `implementation` must be deployed beforehand.
   * @param presetId Warper preset ID.
   * @param implementation Warper implementation account ID.
   */
  async addPreset(presetId: BytesLike, implementation: AccountId): Promise<ContractTransaction> {
    return this.contract.addPreset(presetId, this.accountIdToAddress(implementation));
  }

  /**
   * Removes the association between `presetId` and its implementation.
   * @param presetId Warper preset ID.
   */
  async removePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.removePreset(presetId);
  }

  private normalizeWarperPreset(preset: IWarperPresetFactory.WarperPresetStructOutput): WarperPreset {
    return {
      id: preset.id,
      implementation: this.addressToAccountId(preset.implementation),
      enabled: preset.enabled,
    };
  }
}
