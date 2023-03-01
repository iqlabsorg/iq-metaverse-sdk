import { IListingManager } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { IQSpace, ListingManagerAdapter } from '../src';
import { setupForRenting } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';

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
  let iqspace: IQSpace;
  let listingManagerAdapter: ListingManagerAdapter;

  /** Data Structs */
  let collectionReference: AssetType;
  let listingCreationTxHash: string;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingManager = await ethers.getContract('ListingManager');

    iqspace = await IQSpace.init({ signer: lister });
    listingManagerAdapter = iqspace.listingManager(toAccountId(listingManager.address));

    ({ collectionReference, listingCreationTxHash } = await setupForRenting());
  });

  describe('disableListing', () => {
    beforeEach(async () => {
      await listingManagerAdapter.disableListing(COMMON_ID);
    });

    it('should disable listing', async () => {
      const listingInfo = await listingManager.listingInfo(COMMON_ID);
      expect(listingInfo.enabled).to.be.eq(false);
    });
  });

  describe('withdrawListingAssets', () => {
    beforeEach(async () => {
      await listingManagerAdapter.withdrawListingAssets(COMMON_ID);
    });

    it('should disable listing', async () => {
      const listingInfo = await listingManager.listingInfo(COMMON_ID);
      expect(listingInfo.enabled).to.be.eq(false);
    });
  });

  describe('pauseListing', () => {
    beforeEach(async () => {
      await listingManagerAdapter.pauseListing(COMMON_ID);
    });

    it('should pause listing', async () => {
      const listingInfo = await listingManager.listingInfo(COMMON_ID);
      expect(listingInfo.paused).to.be.eq(true);
    });
  });

  describe('when listing has been paused', () => {
    beforeEach(async () => {
      await listingManager.connect(lister).pauseListing(COMMON_ID);
    });

    describe('unpauseListing', () => {
      beforeEach(async () => {
        await listingManagerAdapter.unpauseListing(COMMON_ID);
      });

      it('should unpause listing', async () => {
        const listingInfo = await listingManager.listingInfo(COMMON_ID);
        expect(listingInfo.paused).to.be.eq(false);
      });
    });
  });

  describe('listing', () => {
    it('should return listing info', async () => {
      const listingInfo = await listingManagerAdapter.listing(COMMON_ID);
      expect(listingInfo.id).to.be.deep.equal(COMMON_ID);
      expect(listingInfo.lister.address).to.be.eq(lister.address);
    });
  });

  describe('listingCount', () => {
    it('should return listing count', async () => {
      const count = await listingManagerAdapter.listingCount();
      expect(count.toNumber()).to.be.eq(1);
    });
  });

  describe('listings', () => {
    it('should return a list of listings', async () => {
      const listing = await listingManagerAdapter.listing(COMMON_ID);
      const listings = await listingManagerAdapter.listings(0, 1);
      expect(listings[0]).to.be.deep.equal(listing);
    });
  });

  describe('userListingCount', () => {
    describe('when user has no listings', () => {
      it('should return 0', async () => {
        const count = await listingManagerAdapter.userListingCount(toAccountId(deployer.address));
        expect(count.toNumber()).to.be.eq(0);
      });
    });

    describe('when user has listings', () => {
      it('should return the number of listings user has', async () => {
        const count = await listingManagerAdapter.userListingCount(toAccountId(lister.address));
        expect(count.toNumber()).to.be.eq(1);
      });
    });
  });

  describe('userListings', () => {
    it('should return a list of user listings', async () => {
      const listing = await listingManagerAdapter.listing(COMMON_ID);
      const listings = await listingManagerAdapter.userListings(toAccountId(lister.address), 0, 1);
      expect(listings[0]).to.be.deep.equal(listing);
    });
  });

  describe('assetListingCount', () => {
    it('should return the number of listings for the asset type', async () => {
      const count = await listingManagerAdapter.assetListingCount(collectionReference);
      expect(count.toNumber()).to.be.eq(1);
    });
  });

  describe('assetListings', () => {
    it('should return a list of asset type listings', async () => {
      const listing = await listingManagerAdapter.listing(COMMON_ID);
      const listings = await listingManagerAdapter.assetListings(collectionReference, 0, 1);
      expect(listings[0]).to.be.deep.equal(listing);
    });
  });

  describe('findListingIdByCreationTransaction', () => {
    it('should return created listing id from transaction hash', async () => {
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(listingCreationTxHash);
      expect(listingId).to.be.eq(COMMON_ID);
    });
  });

  describe('findListingByCreationTransaction', () => {
    it('should return created listing info from transaction hash', async () => {
      const listing = await listingManagerAdapter.findListingByCreationTransaction(listingCreationTxHash);
      expect(listing?.id).to.be.deep.equal(COMMON_ID);
      expect(listing?.lister.address).to.be.eq(lister.address);
    });
  });
});
