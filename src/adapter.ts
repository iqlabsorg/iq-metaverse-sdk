import { Assets, Rentings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { Signer } from 'ethers';
import { AddressTranslator } from './address-translator';
import { AgreementTermsCoder, AssetCoder } from './coders';
import { ContractResolver } from './contract-resolver';
import { Address, AgreementTerms, Asset, AssetNamespace, ChainAware, SignerData } from './types';

export abstract class Adapter implements ChainAware {
  protected constructor(
    protected readonly contractResolver: ContractResolver,
    protected readonly addressTranslator: AddressTranslator,
  ) {}

  async getChainId(): Promise<ChainId> {
    return this.contractResolver.getChainId();
  }

  protected addressToAccountId(address: Address): AccountId {
    return this.addressTranslator.addressToAccountId(address);
  }

  protected addressToAssetType(address: Address, namespace: string): AssetType {
    return this.addressTranslator.addressToAssetType(address, namespace);
  }

  protected accountIdToAddress(accountId: AccountId): Address {
    return this.addressTranslator.accountIdToAddress(accountId);
  }

  protected optionalAccountIdToAddress(accountId?: AccountId): Address | undefined {
    return this.addressTranslator.optionalAccountIdToAddress(accountId);
  }

  protected assetTypeToAddress(assetType: AssetType): Address {
    return this.addressTranslator.assetTypeToAddress(assetType);
  }

  protected assetIdToAddress(assetId: AssetId): Address {
    return this.addressTranslator.assetIdToAddress(assetId);
  }

  protected encodeAsset(asset: Asset): Assets.AssetStruct {
    this.addressTranslator.assertSameChainId(asset.id.chainId);
    return AssetCoder.encode(asset);
  }

  protected decodeAsset(asset: Assets.AssetStructOutput): Asset {
    return AssetCoder.decode(asset, this.addressTranslator.chainId);
  }

  protected encodeAssetClass(namespace: AssetNamespace): string {
    return AssetCoder.encodeAssetClass(namespace);
  }

  protected decodeAssetClass(assetClass: string): AssetNamespace {
    return AssetCoder.decodeAssetClass(assetClass);
  }

  protected decodeAgreementTerms(params: Rentings.AgreementTermsStruct): AgreementTerms {
    return AgreementTermsCoder.decode(this.addressTranslator, params);
  }

  protected async erc20AssetMetadata(assetType: AssetType): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    const metadata = this.contractResolver.resolveERC20Metadata(this.assetTypeToAddress(assetType));
    const [name, symbol, decimals]: [string, string, number] = await Promise.all([
      metadata.name(),
      metadata.symbol(),
      metadata.decimals(),
    ]);

    return { name, symbol, decimals };
  }

  protected async signerData(): Promise<SignerData> {
    const signer = this.contractResolver.getSigner();
    const address = await signer.getAddress();
    return {
      signer,
      address,
      accountId: this.addressToAccountId(address),
    };
  }
}
