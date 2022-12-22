import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { ListingManagerAdapter, Multiverse } from '../src';
import { IListingManager } from '../src/contracts';
import { toAccountId } from './helpers/utils';
import { basicListingAndRentingSetup } from './helpers/setup';

/**
 * @group integration
 */
describe('ListingManagerAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;

  /** Contracts */
  let listingManager: IListingManager;

  /** SDK */
  let multiverse: Multiverse;
  let listingManagerAdapter: ListingManagerAdapter;

  /** Data Structs */
  let collectionReference: AssetType;
  let listingId: BigNumber;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingManager = await ethers.getContract('ListingManager');

    multiverse = await Multiverse.init({ signer: lister });
    listingManagerAdapter = multiverse.listingManager(toAccountId(listingManager.address));

    ({ collectionReference, commonId: listingId } = await basicListingAndRentingSetup());
  });

  describe('disableListing', () => {
    beforeEach(async () => {
      await listingManagerAdapter.disableListing(listingId);
    });

    it('should disable listing', async () => {
      const listingInfo = await listingManager.listingInfo(listingId);
      expect(listingInfo.enabled).toBe(false);
    });
  });

  describe('withdrawListingAssets', () => {
    beforeEach(async () => {
      await listingManagerAdapter.withdrawListingAssets(listingId);
    });

    it('should disable listing', async () => {
      const listingInfo = await listingManager.listingInfo(listingId);
      expect(listingInfo.enabled).toBe(false);
    });
  });

  describe('pauseListing', () => {
    beforeEach(async () => {
      await listingManagerAdapter.pauseListing(listingId);
    });

    it('should pause listing', async () => {
      const listingInfo = await listingManager.listingInfo(listingId);
      expect(listingInfo.paused).toBe(true);
    });
  });

  describe('when listing has been paused', () => {
    beforeEach(async () => {
      await listingManager.connect(lister).pauseListing(listingId);
    });

    describe('unpauseListing', () => {
      beforeEach(async () => {
        await listingManagerAdapter.unpauseListing(listingId);
      });

      it('should unpause listing', async () => {
        const listingInfo = await listingManager.listingInfo(listingId);
        expect(listingInfo.paused).toBe(false);
      });
    });
  });

  describe('listing', () => {
    it('should return listing info', async () => {
      const listingInfo = await listingManagerAdapter.listing(listingId);
      expect(listingInfo.id).toMatchObject(listingId);
      expect(listingInfo.lister.address).toBe(lister.address);
    });
  });

  describe('listingCount', () => {
    it('should return listing count', async () => {
      const count = await listingManagerAdapter.listingCount();
      expect(count.toNumber()).toBe(1);
    });
  });

  describe('listings', () => {
    it('should return a list of listings', async () => {
      const listing = await listingManagerAdapter.listing(listingId);
      const listings = await listingManagerAdapter.listings(0, 1);
      expect(listings[0]).toMatchObject(listing);
    });
  });

  describe('userListingCount', () => {
    describe('when user has no listings', () => {
      it('should return 0', async () => {
        const count = await listingManagerAdapter.userListingCount(toAccountId(deployer.address));
        expect(count.toNumber()).toBe(0);
      });
    });

    describe('when user has listings', () => {
      it('should return the number of listings user has', async () => {
        const count = await listingManagerAdapter.userListingCount(toAccountId(lister.address));
        expect(count.toNumber()).toBe(1);
      });
    });
  });

  describe('userListings', () => {
    it('should return a list of user listings', async () => {
      const listing = await listingManagerAdapter.listing(listingId);
      const listings = await listingManagerAdapter.userListings(toAccountId(lister.address), 0, 1);
      expect(listings[0]).toMatchObject(listing);
    });
  });

  describe('assetListingCount', () => {
    it('should return the number of listings for the asset type', async () => {
      const count = await listingManagerAdapter.assetListingCount(collectionReference);
      expect(count.toNumber()).toBe(1);
    });
  });

  describe('assetListings', () => {
    it('should return a list of asset type listings', async () => {
      const listing = await listingManagerAdapter.listing(listingId);
      const listings = await listingManagerAdapter.assetListings(collectionReference, 0, 1);
      expect(listings[0]).toMatchObject(listing);
    });
  });
});
