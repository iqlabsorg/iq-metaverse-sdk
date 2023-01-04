import { AccountId, AssetType } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { warperPresetMap } from '../constants';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ERC721ConfigurablePreset__factory, WarperPresetFactory } from '../contracts';
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
  async deployPreset(
    presetId: 'ERC721ConfigurablePreset',
    data: { metahub: AccountId; original: AssetType },
  ): Promise<ContractTransaction> {
    const encodedPresetId = warperPresetMap.get(presetId);
    if (!encodedPresetId) {
      throw new Error('Invalid warper preset ID');
    }

    return this.contract.deployPreset(encodedPresetId, this.encodePresetInitData(presetId, data));
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

  private encodePresetInitData(presetId: string, data: { metahub: AccountId; original: AssetType }): BytesLike {
    if (presetId !== 'ERC721ConfigurablePreset') {
      throw new Error(`Unknown preset ID: "${presetId}"`);
    }

    const { reference } = data.original.assetName;
    AddressTranslator.assertTypeERC721(data.original);

    return ERC721ConfigurablePreset__factory.createInterface().encodeFunctionData('__initialize', [
      defaultAbiCoder.encode(
        ['address', 'address'],
        [
          this.accountIdToAddress(new AccountId({ chainId: data.original.chainId, address: reference })),
          this.accountIdToAddress(data.metahub),
        ],
      ),
    ]);
  }
}
