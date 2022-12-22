import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { ListingManagerAdapter, Multiverse } from '../src';
import { ERC20Mock, ERC20Mock__factory, ERC721Mock, ERC721Mock__factory, IListingManager } from '../src/contracts';
import { Assets } from '../src/contracts/contracts/listing/listing-manager/ListingManager';
import { grantRoles } from './helpers/acl';
import { createAssetReference, makeERC721Asset, mintAndApproveNFTs } from './helpers/asset';
import { toAccountId } from './helpers/caip';
import { createListing } from './helpers/listing';
import { createUniverse } from './helpers/universe';
import { createAndRegisterWarper } from './helpers/warper';

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

  /** Mocks & Samples */
  let nft: ERC721Mock;
  let baseToken: ERC20Mock;

  /** Constants */
  const listingId = BigNumber.from(1);
  const universeId = BigNumber.from(1);

  /** Data Structs */
  let listingAssets: Assets.AssetStruct[];
  let nftReference: AssetType;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingManager = await ethers.getContract('ListingManager');
    nft = new ERC721Mock__factory().attach('0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901');
    baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    multiverse = await Multiverse.init({ signer: lister });
    listingManagerAdapter = multiverse.listingManager(toAccountId(listingManager.address));

    listingAssets = [makeERC721Asset(nft.address, 1)];
    nftReference = createAssetReference('erc721', nft.address);

    await grantRoles(lister.address, deployer.address);
    await mintAndApproveNFTs(nft, lister);
    await createUniverse(baseToken);
    await createAndRegisterWarper(nft, multiverse, universeId);
  }, 20000);

  describe('when listing has been created', () => {
    beforeEach(async () => {
      await createListing(lister, listingAssets);
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
        const count = await listingManagerAdapter.assetListingCount(nftReference);
        expect(count.toNumber()).toBe(1);
      });
    });

    describe('assetListings', () => {
      it('should return a list of asset type listings', async () => {
        const listing = await listingManagerAdapter.listing(listingId);
        const listings = await listingManagerAdapter.assetListings(nftReference, 0, 1);
        expect(listings[0]).toMatchObject(listing);
      });
    });
  });
});
