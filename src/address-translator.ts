import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { Address, AssetNamespace } from './types';

export class AddressTranslator {
  constructor(public readonly chainId: ChainId) {}

  /**
   * Asserts that given chain IDs match.
   */
  static assertSameChainId(chainId: ChainId, expectedChainId: ChainId): void {
    if (chainId.toString() !== expectedChainId.toString()) {
      throw new Error(`Chain ID mismatch! Expected chain ID: ${expectedChainId.toString()}`);
    }
  }

  /**
   * Asserts that given asset ID and asset type objects have the same namespace.
   */
  static assertSameAssetType(assetId: AssetId, assetType: AssetType): void {
    const { chainId, assetName } = assetType;
    this.assertSameChainId(assetId.chainId, chainId);

    if (assetName.toString() !== assetId.assetName.toString()) {
      throw new Error(`Asset mismatch! Expected asset: ${assetName.toString()}`);
    }
  }

  /**
   * Asserts that given asset is ERC721.
   */
  static assertTypeERC721 = (asset: AssetType | AssetId): void => {
    const { namespace } = asset.assetName;
    if (namespace !== 'erc721') {
      throw new Error(`Invalid asset type: "${namespace}"! Expected: "erc721"`);
    }
  };

  /**
   * Asserts that given asset is ERC20.
   */
  static assertTypeERC20 = (asset: AssetType | AssetId): void => {
    const { namespace } = asset.assetName;
    if (namespace !== 'erc20') {
      throw new Error(`Invalid asset type: "${namespace}"! Expected: "erc20"`);
    }
  };

  /**
   * Creates AssetType object.
   * @param accountId Asset account ID.
   * @param namespace Asset namespace.
   */
  static createAssetType(accountId: AccountId, namespace: AssetNamespace): AssetType {
    return new AssetType({
      chainId: accountId.chainId,
      assetName: {
        namespace,
        reference: accountId.address,
      },
    });
  }

  /**
   * Creates Asset ID object.
   * @param accountId Asset account ID.
   * @param namespace Asset namespace.
   * @param tokenId Asset token ID.
   */
  static createAssetId(accountId: AccountId, namespace: AssetNamespace, tokenId: string): AssetId {
    return new AssetId({
      chainId: accountId.chainId,
      assetName: {
        namespace,
        reference: accountId.address,
      },
      tokenId,
    });
  }

  /**
   * Asserts that given chain ID matches with the configured chain ID.
   * @param chainId Chain ID.
   */
  assertSameChainId(chainId: ChainId): void {
    AddressTranslator.assertSameChainId(chainId, this.chainId);
  }

  /**
   * Transforms address to account ID object.
   * @param address Address.
   */
  addressToAccountId(address: Address): AccountId {
    return new AccountId({ chainId: this.chainId, address });
  }

  /**
   * Transforms address to asset type object.
   * @param address Asset address.
   * @param namespace Asset namespace.
   */
  addressToAssetType(address: Address, namespace: string): AssetType {
    return new AssetType({
      chainId: this.chainId,
      assetName: {
        namespace,
        reference: address,
      },
    });
  }

  /**
   * Transforms account ID object to address.
   * @param accountId Account ID.
   */
  accountIdToAddress(accountId: AccountId): Address {
    this.assertSameChainId(accountId.chainId);
    return accountId.address;
  }

  /**
   * Transforms account ID object to address or undefined.
   * @param accountId Account ID.
   */
  optionalAccountIdToAddress(accountId?: AccountId): Address | undefined {
    return accountId ? this.accountIdToAddress(accountId) : undefined;
  }

  /**
   * Tranforms asset type object to address.
   * @param assetType Asset type.
   */
  assetTypeToAddress(assetType: AssetType): Address {
    this.assertSameChainId(assetType.chainId);
    return assetType.assetName.reference;
  }

  /**
   * Transforms asset ID object to address.
   * @param assetId Asset ID.
   */
  assetIdToAddress(assetId: AssetId): Address {
    this.assertSameChainId(assetId.chainId);
    return assetId.assetName.reference;
  }
}
