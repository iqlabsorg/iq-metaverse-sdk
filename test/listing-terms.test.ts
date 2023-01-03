import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { ListingTermsRegistryAdapter, Multiverse } from '../src';
import { IListingTermsRegistry } from '../src/contracts';
import { setupForRenting } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ListingTermsRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;

  /** Contracts */
  let listingTermsRegistry: IListingTermsRegistry;

  /** SDK */
  let multiverse: Multiverse;
  let listingTermsRegistryAdapter: ListingTermsRegistryAdapter;

  /** Data Structs */
  let listingCreationTxHash: string;
  let listingTerms: IListingTermsRegistry.ListingTermsStruct;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');

    multiverse = await Multiverse.init({ signer: lister });
    listingTermsRegistryAdapter = multiverse.listingTermsRegistry(toAccountId(listingTermsRegistry.address));

    ({ listingCreationTxHash, listingTerms } = await setupForRenting());
  });

  describe('listingTerms', () => {
    it('should return listing terms', async () => {
      const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);
      expect(terms).toBeDefined();
      expect(terms.id).toMatchObject(COMMON_ID);
      expect(terms).toMatchObject(listingTerms);
    });
  });

  describe('findListingTermsIdByCreationTransaction', () => {
    it('should return created listing id from transaction hash', async () => {
      const termsId = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(listingCreationTxHash);
      expect(termsId).toBeDefined();
      expect(termsId).toMatchObject(COMMON_ID);
    });
  });

  describe('findListingTermsByCreationTransaction', () => {
    it('should return created listing info from transaction hash', async () => {
      const terms = await listingTermsRegistryAdapter.findListingTermsByCreationTransaction(listingCreationTxHash);
      expect(terms).toBeDefined();
      expect(terms?.id).toMatchObject(COMMON_ID);
      expect(terms).toMatchObject(listingTerms);
    });
  });
});
