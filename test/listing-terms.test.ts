import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { AssetType, IQSpace, ListingTermsRegistryAdapter, LISTING_STRATEGIES } from '../src';
import { IListingTermsRegistry } from '../src/contracts';
import { setupForRenting } from './helpers/setup';
import { COMMON_BASE_RATE, COMMON_ID, COMMON_REWARD_RATE, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ListingTermsRegistryAdapter', () => {
  /** Signers */
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

    lister = await ethers.getNamedSigner('assetOwner');

    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');

    iqspace = await IQSpace.init({ signer: lister });
    listingTermsRegistryAdapter = iqspace.listingTermsRegistry(toAccountId(listingTermsRegistry.address));
  });

  describe('listingTerms', () => {
    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        await setupForRenting();
      });

      it('should return listing terms with fixed rate tax', async () => {
        const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);

        expect(terms).toMatchObject({
          id: COMMON_ID,
          name: LISTING_STRATEGIES.FIXED_RATE,
          data: {
            pricePerSecondInEthers: COMMON_BASE_RATE,
          },
        });
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        await setupForRenting(true);
      });

      it('should return listing terms with fixed rate and reward tax', async () => {
        const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);

        expect(terms).toMatchObject({
          id: COMMON_ID,
          name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
          data: {
            pricePerSecondInEthers: COMMON_BASE_RATE,
            rewardRatePercent: COMMON_REWARD_RATE,
          },
        });
      });
    });
  });

  describe('when universe, warper and listing is setup', () => {
    beforeEach(async () => {
      ({ listingCreationTxHash, warperReference } = await setupForRenting());
    });

    describe('allListingTerms', () => {
      it('should return all terms for a given listing', async () => {
        const infos = await listingTermsRegistryAdapter.allListingTerms(
          { listingId: COMMON_ID, universeId: COMMON_ID, warper: warperReference },
          0,
          5,
        );
        expect(infos.length).toBeGreaterThan(0);
        expect(infos[0]).toMatchObject({
          id: COMMON_ID,
          name: LISTING_STRATEGIES.FIXED_RATE,
          data: {
            pricePerSecondInEthers: COMMON_BASE_RATE,
          },
        });
      });
    });

    describe('listingTermsWithParams', () => {
      it('should return listing terms with additional parameters', async () => {
        const termsWithParams = await listingTermsRegistryAdapter.listingTermsWithParams(COMMON_ID);

        expect(termsWithParams).toMatchObject({
          id: COMMON_ID,
          name: LISTING_STRATEGIES.FIXED_RATE,
          data: {
            pricePerSecondInEthers: COMMON_BASE_RATE,
          },
          universeId: COMMON_ID,
          listingId: COMMON_ID,
          //warper: warperReference, // zero?
        });
      });
    });

    describe('findListingTermsIdByCreationTransaction', () => {
      it('should return created listing id from transaction hash', async () => {
        const termsId = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
          listingCreationTxHash,
        );
        expect(termsId).toBeDefined();
        expect(termsId).toMatchObject(COMMON_ID);
      });
    });

    describe('findListingTermsByCreationTransaction', () => {
      it('should return created listing info from transaction hash', async () => {
        const terms = await listingTermsRegistryAdapter.findListingTermsByCreationTransaction(listingCreationTxHash);
        expect(terms).toMatchObject({
          id: COMMON_ID,
          name: LISTING_STRATEGIES.FIXED_RATE,
          data: {
            pricePerSecondInEthers: COMMON_BASE_RATE,
          },
        });
      });
    });
  });
});
