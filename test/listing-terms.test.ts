import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { AssetType, IQSpace, ListingTermsRegistryAdapter, LISTING_STRATEGIES } from '../src';
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
  let iqspace: IQSpace;
  let listingTermsRegistryAdapter: ListingTermsRegistryAdapter;

  /** Data Structs */
  let listingCreationTxHash: string;
  let warperReference: AssetType;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');

    iqspace = await IQSpace.init({ signer: lister });
    listingTermsRegistryAdapter = iqspace.listingTermsRegistry(toAccountId(listingTermsRegistry.address));

    ({ listingCreationTxHash, warperReference } = await setupForRenting());
  });

  describe('listingTerms', () => {
    it('should return listing terms', async () => {
      const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);
      expect(terms).toBeDefined();
      expect(terms.id).toMatchObject(COMMON_ID);
      expect(terms.name).toBe(LISTING_STRATEGIES.FIXED_RATE);
      expect(terms.data.pricePerSecondInEthers).toBeDefined();
    });
  });

  describe('allListingTerms', () => {
    it('should return all terms for a given listing', async () => {
      const infos = await listingTermsRegistryAdapter.allListingTerms(
        { listingId: COMMON_ID, universeId: COMMON_ID, warper: warperReference },
        0,
        5,
      );
      expect(infos.length).toBeGreaterThan(0);
      expect(infos[0].id).toMatchObject(COMMON_ID);
      expect(infos[0].name).toBe(LISTING_STRATEGIES.FIXED_RATE);
      expect(infos[0].data.pricePerSecondInEthers).toBeDefined();
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
      expect(terms?.name).toBe(LISTING_STRATEGIES.FIXED_RATE);
      expect(terms?.data.pricePerSecondInEthers).toBeDefined();
    });
  });
});
