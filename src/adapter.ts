import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { AddressTranslator } from './address-translator';
import { AgreementTermsCoder } from './coders/agreement-terms-coder';
import { AssetCoder } from './coders/asset-coder';
import { ListingStrategyCoder } from './coders/listing-strategy-coder';
import { ContractResolver } from './contract-resolver';
import { IListingTermsRegistry } from './contracts';
import { Assets, Rentings } from './contracts/contracts/metahub/IMetahub';
import { Address, AgreementTerms, Asset, ChainAware, ListingStrategyParams } from './types';

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

  protected encodeListingParams(params: ListingStrategyParams): IListingTermsRegistry.ListingTermsStruct {
    return ListingStrategyCoder.encode(params);
  }

  protected decodeListingParams(params: IListingTermsRegistry.ListingTermsStruct): ListingStrategyParams {
    return ListingStrategyCoder.decode(params);
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

  protected async signerAddress(): Promise<Address> {
    return this.contractResolver.signerAddress();
  }
}
