import { AccountId, AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { WarperPresetFactory } from '../contracts';
import { WarperPresetIds, WarperPresetInitData } from '../types';
import { assetClassToNamespace } from '../utils';

export class WarperPresetFactoryAdapter extends Adapter {
  private readonly contract: WarperPresetFactory;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperPresetFactory(accountId.address);
  }

  /**
   * Deploys new instance of warper from preset.
   * @param presetId
   * @param data Preset specific configuration.
   */
  async deployPreset(presetId: WarperPresetIds, data: WarperPresetInitData): Promise<ContractTransaction> {
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
}
