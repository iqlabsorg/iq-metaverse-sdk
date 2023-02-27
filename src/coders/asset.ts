/* eslint-disable sonarjs/no-small-switch */
import { defaultAbiCoder } from 'ethers/lib/utils';
import { Asset, AssetNamespace } from '../types';
import { BigNumber } from '@ethersproject/bignumber';
import { Assets } from '../contracts/contracts/metahub/core/IMetahub';
import { AssetId, ChainId } from 'caip';
import { assetClassToNamespaceMap, namespaceToAssetClassMap } from '../constants';
import { ASSET_CLASS_IDS } from '@iqprotocol/iq-space-protocol-light';

export class AssetCoder {
  /**
   * Encodes asset structure.
   * @param asset Asset.
   */
  static encode({ id, value }: Asset): Assets.AssetStruct {
    switch (id.assetName.namespace) {
      case 'erc721': {
        return {
          id: {
            class: ASSET_CLASS_IDS.ERC721,
            data: defaultAbiCoder.encode(['address', 'uint256'], [id.assetName.reference, id.tokenId]),
          },
          value,
        };
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
  static decode({ id, value }: Assets.AssetStructOutput, chainId: ChainId): Asset {
    switch (id.class) {
      case ASSET_CLASS_IDS.ERC721: {
        const [address, tokenId] = defaultAbiCoder.decode(['address', 'uint256'], id.data) as [string, BigNumber];
        return {
          value,
          id: new AssetId({
            chainId,
            assetName: {
              namespace: AssetCoder.decodeAssetClass(id.class),
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
