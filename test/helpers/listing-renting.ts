import {
  GlobalListingTermsRegisteredEventFilter,
  UniverseListingTermsRegisteredEventFilter,
  WarperListingTermsRegisteredEventFilter,
} from '@iqprotocol/solidity-contracts-nft/typechain/contracts/listing/listing-terms-registry/IListingTermsRegistry';
import { BytesLike } from 'ethers';
import { ethers } from 'hardhat';
import { EMPTY_BYTES_DATA_HEX } from '../../src';
import { IListingTermsRegistry } from '../../src/contracts';

export const getTokenQuoteData = (): { tokenQuote: BytesLike; tokenQuoteSignature: BytesLike } => {
  return { tokenQuote: EMPTY_BYTES_DATA_HEX, tokenQuoteSignature: EMPTY_BYTES_DATA_HEX };
};

export const findListingTermsIdByTransaction = async (
  transactionHash: string,
  scope: 'global' | 'universe' | 'warper',
) => {
  const listingTermsRegistry = (await ethers.getContract('ListingTermsRegistry')) as IListingTermsRegistry;
  const tx = await listingTermsRegistry.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  let filter:
    | GlobalListingTermsRegisteredEventFilter
    | UniverseListingTermsRegisteredEventFilter
    | WarperListingTermsRegisteredEventFilter;

  switch (scope) {
    case 'global':
      filter = listingTermsRegistry.filters.GlobalListingTermsRegistered();
      break;
    case 'universe':
      filter = listingTermsRegistry.filters.UniverseListingTermsRegistered();
      break;
    case 'warper':
      filter = listingTermsRegistry.filters.WarperListingTermsRegistered();
      break;
    default:
      filter = listingTermsRegistry.filters.GlobalListingTermsRegistered();
      break;
  }

  const event = (await listingTermsRegistry.queryFilter(filter, tx.blockHash)).find(
    event => event.transactionHash === transactionHash,
  );

  if (!event) {
    return undefined;
  }

  return event.args.listingTermsId;
};
