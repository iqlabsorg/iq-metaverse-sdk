import { AccountId, AssetType, ChainId } from 'caip';
import { Signer } from 'ethers';
import {
  ListingWizardAdapter,
  MetahubAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapter,
  WarperManagerAdapter,
  WarperPresetFactoryAdapter,
  WarperWizardAdapter,
} from './adapters';
import { ERC721WarperAdapter } from './adapters/erc721-warper';
import { AddressTranslator } from './address-translator';
import { ContractResolver } from './contract-resolver';
import { ChainAware } from './types';

type MultiverseParams = {
  signer: Signer;
};

export class Multiverse implements ChainAware {
  private readonly contractResolver: ContractResolver;
  private readonly addressTranslator: AddressTranslator;

  private constructor(private readonly signer: Signer, private readonly chainId: ChainId) {
    this.contractResolver = new ContractResolver(signer);
    this.addressTranslator = new AddressTranslator(chainId);
  }

  /**
   * Multiverse connection initializer.
   * @param params
   */
  static async init(params: MultiverseParams): Promise<Multiverse> {
    const { signer } = params;
    const chainId = await signer.getChainId();
    return new Multiverse(signer, new ChainId({ namespace: 'eip155', reference: chainId.toString() }));
  }

  async getChainId(): Promise<ChainId> {
    return Promise.resolve(this.chainId);
  }

  warper(assetType: AssetType): ERC721WarperAdapter {
    AddressTranslator.assertTypeERC721(assetType);
    return new ERC721WarperAdapter(assetType, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the universe registry adapter.
   * @param accountId Universe registry account ID.
   */
  universeRegistry(accountId: AccountId): UniverseRegistryAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new UniverseRegistryAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the metahub registry adapter.
   * @param accountId Metahub account ID.
   */
  async metahub(accountId: AccountId): Promise<MetahubAdapter> {
    this.addressTranslator.assertSameChainId(accountId.chainId);

    return MetahubAdapter.create(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the warper preset factory adapter.
   * @param accountId Warper preset factory account ID.
   */
  warperPresetFactory(accountId: AccountId): WarperPresetFactoryAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new WarperPresetFactoryAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the warper manager adapter.
   * @param accountId Warper manager account ID.
   */
  warperManager(accountId: AccountId): WarperManagerAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new WarperManagerAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the listing wizard adapter.
   * @param accountId Listing wizard account ID.
   * @returns
   */
  listingWizard(accountId: AccountId): ListingWizardAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new ListingWizardAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the universe wizard adapter.
   * @param accountId Universe wizard account ID.
   * @returns
   */
  universeWizard(accountId: AccountId): UniverseWizardAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new UniverseWizardAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the warper wizard adapter.
   * @param accountId Warper wizard account ID.
   * @returns
   */
  warperWizard(accountId: AccountId): WarperWizardAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new WarperWizardAdapter(accountId, this.contractResolver, this.addressTranslator);
  }
}
