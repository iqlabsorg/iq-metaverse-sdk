import { ChainId } from 'caip';
import { Signer } from 'ethers';
import {
  ACL,
  ACL__factory,
  AssetClassRegistry,
  AssetClassRegistry__factory,
  AssetVault,
  AssetVault__factory,
  ERC20,
  ERC20__factory,
  ERC721,
  ERC721AssetVault,
  ERC721AssetVault__factory,
  ERC721Warper,
  ERC721Warper__factory,
  ERC721__factory,
  IERC20Metadata,
  IERC20Metadata__factory,
  IERC721Metadata,
  IERC721Metadata__factory,
  ListingConfiguratorPresetFactory,
  ListingConfiguratorPresetFactory__factory,
  ListingConfiguratorRegistry,
  ListingConfiguratorRegistry__factory,
  ListingManager,
  ListingManager__factory,
  ListingStrategyRegistry,
  ListingStrategyRegistry__factory,
  ListingTermsRegistry,
  ListingTermsRegistry__factory,
  ListingWizardV1,
  ListingWizardV1__factory,
  Metahub,
  Metahub__factory,
  RentingManager,
  RentingManager__factory,
  TaxStrategyRegistry,
  TaxStrategyRegistry__factory,
  TaxTermsRegistry,
  TaxTermsRegistry__factory,
  UniverseRegistry,
  UniverseRegistry__factory,
  UniverseToken,
  UniverseToken__factory,
  UniverseWizardV1,
  UniverseWizardV1__factory,
  Warper,
  WarperManager,
  WarperManager__factory,
  WarperPresetFactory,
  WarperPresetFactory__factory,
  WarperWizardV1,
  WarperWizardV1__factory,
  Warper__factory,
} from './contracts';
import { Address, ChainAware } from './types';

export class ContractResolver implements ChainAware {
  constructor(private readonly signer: Signer) {}

  async getChainId(): Promise<ChainId> {
    const reference = await this.signer.getChainId();
    return new ChainId({ namespace: 'eip155', reference: reference.toString() });
  }

  async signerAddress(): Promise<Address> {
    return this.signer.getAddress();
  }

  resolveACL(address: Address): ACL {
    return ACL__factory.connect(address, this.signer);
  }

  resolveAssetClassRegistry(address: Address): AssetClassRegistry {
    return AssetClassRegistry__factory.connect(address, this.signer);
  }

  resolveListingStrategyRegistry(address: Address): ListingStrategyRegistry {
    return ListingStrategyRegistry__factory.connect(address, this.signer);
  }

  resolveMetahub(address: Address): Metahub {
    return Metahub__factory.connect(address, this.signer);
  }

  resolveUniverseRegistry(address: Address): UniverseRegistry {
    return UniverseRegistry__factory.connect(address, this.signer);
  }

  resolveUniverseToken(address: Address): UniverseToken {
    return UniverseToken__factory.connect(address, this.signer);
  }

  resolveWarperPresetFactory(address: Address): WarperPresetFactory {
    return WarperPresetFactory__factory.connect(address, this.signer);
  }

  resolveListingManager(address: Address): ListingManager {
    return ListingManager__factory.connect(address, this.signer);
  }

  resolveListingTermsRegistry(address: Address): ListingTermsRegistry {
    return ListingTermsRegistry__factory.connect(address, this.signer);
  }

  resolveListingConfiguratorRegistry(address: Address): ListingConfiguratorRegistry {
    return ListingConfiguratorRegistry__factory.connect(address, this.signer);
  }

  resolveListingConfiguratorPresetFactory(address: Address): ListingConfiguratorPresetFactory {
    return ListingConfiguratorPresetFactory__factory.connect(address, this.signer);
  }

  resolveTaxTermsRegistry(address: Address): TaxTermsRegistry {
    return TaxTermsRegistry__factory.connect(address, this.signer);
  }

  resolveTaxStrategyRegistry(address: Address): TaxStrategyRegistry {
    return TaxStrategyRegistry__factory.connect(address, this.signer);
  }

  resolveRentingManager(address: Address): RentingManager {
    return RentingManager__factory.connect(address, this.signer);
  }

  resolveWarperManager(address: Address): WarperManager {
    return WarperManager__factory.connect(address, this.signer);
  }

  resolveWarper(address: Address): Warper {
    return Warper__factory.connect(address, this.signer);
  }

  resolveAssetVault(address: Address): AssetVault {
    return AssetVault__factory.connect(address, this.signer);
  }

  resolveERC721Warper(address: Address): ERC721Warper {
    return ERC721Warper__factory.connect(address, this.signer);
  }

  resolveERC721AssetVault(address: Address): ERC721AssetVault {
    return ERC721AssetVault__factory.connect(address, this.signer);
  }

  resolveERC721Asset(address: Address): ERC721 {
    return ERC721__factory.connect(address, this.signer);
  }

  resolveERC721Metadata(address: Address): IERC721Metadata {
    return IERC721Metadata__factory.connect(address, this.signer);
  }

  resolveERC20Asset(address: Address): ERC20 {
    return ERC20__factory.connect(address, this.signer);
  }

  resolveERC20Metadata(address: Address): IERC20Metadata {
    return IERC20Metadata__factory.connect(address, this.signer);
  }

  resolveUniverseWizardV1(address: Address): UniverseWizardV1 {
    return UniverseWizardV1__factory.connect(address, this.signer);
  }

  resolveListingWizardV1(address: Address): ListingWizardV1 {
    return ListingWizardV1__factory.connect(address, this.signer);
  }

  resolveWarperWizardV1(address: Address): WarperWizardV1 {
    return WarperWizardV1__factory.connect(address, this.signer);
  }
}
