/* eslint-disable sonarjs/no-small-switch */
import { ASSET_CLASS_IDS, decodeERC721Asset, makeERC721Asset } from '@iqprotocol/iq-space-protocol-light';
import { Assets } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { AssetId, ChainId } from 'caip';
import { assetClassToNamespaceMap, namespaceToAssetClassMap } from '../constants';
import { Asset, AssetNamespace } from '../types';

export class AssetCoder {
  /**
   * Encodes asset structure.
   * @param asset Asset.
   */
  static encode({ id }: Asset): Assets.AssetStruct {
    switch (id.assetName.namespace) {
      case 'erc721': {
        return makeERC721Asset(id.assetName.reference, id.tokenId);
      }

      default: {
        throw Error('Unrecognized asset class');
      }
    }
  }

  /**
   * Decodes asset structure.
   * @param params Asset structure.
   * @param chainId Chain ID.
   */
  static decode(asset: Assets.AssetStructOutput, chainId: ChainId): Asset {
    switch (asset.id.class) {
      case ASSET_CLASS_IDS.ERC721: {
        const { originalCollectionAddress: address, assetId: tokenId, assetValue: value } = decodeERC721Asset(asset);
        return {
          value,
          id: new AssetId({
            chainId,
            assetName: {
              namespace: AssetCoder.decodeAssetClass(asset.id.class),
              reference: address,
            },
            tokenId: tokenId.toString(),
          }),
        };
      }

      default: {
        throw Error('Unrecognized asset class');
      }
    }
  }

  /**
   * Encodes asset class (from namespace).
   * @param namespace CAIP-19 namespace.
   */
  static encodeAssetClass(namespace: AssetNamespace): string {
    const assetClass = namespaceToAssetClassMap.get(namespace);
    if (!assetClass) {
      throw new Error('Unknown asset class');
    }

    return assetClass;
  }

  /**
   * Decodes asset class (to namespace).
   * @param assetClass Asset class bytes.
   * @returns CAIP-19 namespace.
   */
  static decodeAssetClass(assetClass: string): AssetNamespace {
    const namespace = assetClassToNamespaceMap.get(assetClass);
    if (!namespace) {
      throw new Error('Unknown asset class');
    }

    return namespace;
  }
}
