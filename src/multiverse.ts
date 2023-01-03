import { AccountId, AssetType, ChainId } from 'caip';
import { Signer } from 'ethers';
import {
  ListingWizardAdapterV1,
  MetahubAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  WarperManagerAdapter,
  ListingManagerAdapter,
  RentingManagerAdapter,
  WarperPresetFactoryAdapter,
  WarperWizardAdapterV1,
  ListingTermsRegistryAdapter,
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
  metahub(accountId: AccountId): MetahubAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new MetahubAdapter(accountId, this.contractResolver, this.addressTranslator);
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
   * Resolves the listing manager adapter.
   * @param accountId Listing manager account ID.
   */
  listingManager(accountId: AccountId): ListingManagerAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new ListingManagerAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the renting manager adapter.
   * @param accountId Renting manager account ID.
   */
  rentingManager(accountId: AccountId): RentingManagerAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new RentingManagerAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the listing terms registry adapter.
   * @param accountId Listing terms registry account ID.
   */
  listingTermsRegistry(accountId: AccountId): ListingTermsRegistryAdapter {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new ListingTermsRegistryAdapter(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the listing wizard adapter (version 1).
   * @param accountId Listing wizard account ID.
   * @returns
   */
  listingWizardV1(accountId: AccountId): ListingWizardAdapterV1 {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new ListingWizardAdapterV1(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the universe wizard adapter (version 1).
   * @param accountId Universe wizard account ID.
   * @returns
   */
  universeWizardV1(accountId: AccountId): UniverseWizardAdapterV1 {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new UniverseWizardAdapterV1(accountId, this.contractResolver, this.addressTranslator);
  }

  /**
   * Resolves the warper wizard adapter (version 1).
   * @param accountId Warper wizard account ID.
   * @returns
   */
  warperWizardV1(accountId: AccountId): WarperWizardAdapterV1 {
    this.addressTranslator.assertSameChainId(accountId.chainId);
    return new WarperWizardAdapterV1(accountId, this.contractResolver, this.addressTranslator);
  }
}
