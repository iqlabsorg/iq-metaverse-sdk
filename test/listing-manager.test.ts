import { ROLES_LIBRARY_IDS, WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { MetahubAdapter, Multiverse } from '../src';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721Mock,
  ERC721Mock__factory,
  IACL,
  IAssetClassRegistry,
  IListingManager,
  IMetahub,
  IUniverseRegistry,
  IWarperManager,
  IWarperPresetFactory,
} from '../src/contracts';
import { Assets, Listings } from '../src/contracts/contracts/listing/listing-manager/ListingManager';
import { makeERC721Asset } from './helpers/asset';
import { toAccountId } from './helpers/caip';
import { makeListingParams } from './helpers/listing';
import { makeUniverseParams } from './helpers/universe';
import { getERC721ConfigurablePresetInitData } from './helpers/warper';
import { AssetType } from 'caip';

/**
 * @group unit
 */
describe('ListingManagerAdapter (via MetahubAdapter)', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let nftCreator: SignerWithAddress;

  /** Contracts */
  let acl: IACL;
  let metahub: IMetahub;
  let listingManager: IListingManager;
  let universeRegistry: IUniverseRegistry;
  let assetClassRegistry: IAssetClassRegistry;
  let warperPresetFactory: IWarperPresetFactory;
  let warperManager: IWarperManager;

  /** SDK */
  let multiverse: Multiverse;
  let metahubAdapter: MetahubAdapter;

  /** Mocks & Samples */
  let nft: ERC721Mock;
  let baseToken: ERC20Mock;

  /** Constants */
  const GLOBAL_MAX_LOCK_PERIOD = 3600;
  const GLOBAL_IMMEDIATE_PAYOUT = false;
  const listingId = BigNumber.from(1);
  const universeId = BigNumber.from(1);

  /** Data Structs */
  let listingParams: Listings.ParamsStruct;
  let listingAssets: Assets.AssetStruct[];
  let assetType: AssetType;

  /** Setup */
  const grantRoles = async (): Promise<void> => {
    await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, lister.address);
    await acl.grantRole(ROLES_LIBRARY_IDS.UNIVERSE_WIZARD_ROLE, deployer.address);
  };

  const mintAndApproveNFTs = async (): Promise<void> => {
    for (let i = 1; i < 5; i++) {
      await nft.connect(nftCreator).mint(lister.address, i);
    }

    await nft.connect(lister).setApprovalForAll(metahub.address, true);
  };

  const createUniverse = async (): Promise<void> => {
    const universeParams = makeUniverseParams('Test Universe', [baseToken.address]);
    await universeRegistry.createUniverse(universeParams);
  };

  const createAndRegisterWarper = async (): Promise<void> => {
    const tx = await warperPresetFactory.deployPreset(
      WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
      getERC721ConfigurablePresetInitData(metahub.address, nft.address),
    );
    const wpfAdapter = multiverse.warperPresetFactory(toAccountId(warperPresetFactory.address));
    const warperAddress = await wpfAdapter.findWarperByDeploymentTransaction(tx.hash);
    await warperManager.registerWarper(warperAddress!.assetName.reference!, {
      name: 'Warper',
      universeId,
      paused: true,
    });
  };

  const createAssets = (): void => {};

  const createListing = async (): Promise<void> => {
    await listingManager
      .connect(lister)
      .createListing(listingAssets, listingParams, GLOBAL_MAX_LOCK_PERIOD, GLOBAL_IMMEDIATE_PAYOUT);
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');
    nftCreator = await ethers.getNamedSigner('nftCreator');

    acl = await ethers.getContract('ACL');
    metahub = await ethers.getContract('Metahub');
    listingManager = await ethers.getContract('ListingManager');
    universeRegistry = await ethers.getContract('UniverseRegistry');
    assetClassRegistry = await ethers.getContract('AssetClassRegistry');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    warperManager = await ethers.getContract('WarperManager');

    nft = new ERC721Mock__factory().attach('0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901');
    baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    multiverse = await Multiverse.init({ signer: lister });
    metahubAdapter = await multiverse.metahub(toAccountId(metahub.address));

    listingParams = makeListingParams(lister.address);
    listingAssets = [makeERC721Asset(nft.address, 1)];

    assetType = new AssetType({
      chainId: { namespace: 'eip155', reference: '31337' },
      assetName: { namespace: 'erc721', reference: nft.address },
    });

    await grantRoles();
    await mintAndApproveNFTs();
    await createUniverse();
    await createAndRegisterWarper();
  }, 20000);

  describe('when listing has been created', () => {
    beforeEach(async () => {
      await createListing();
    });

    describe('disableListing', () => {
      beforeEach(async () => {
        await metahubAdapter.disableListing(listingId);
      });

      it('should disable listing', async () => {
        const listingInfo = await listingManager.listingInfo(listingId);
        expect(listingInfo.enabled).toBe(false);
      });
    });

    describe('withdrawListingAssets', () => {
      beforeEach(async () => {
        await metahubAdapter.withdrawListingAssets(listingId);
      });

      it('should disable listing', async () => {
        const listingInfo = await listingManager.listingInfo(listingId);
        expect(listingInfo.enabled).toBe(false);
      });
    });

    describe('pauseListing', () => {
      beforeEach(async () => {
        await metahubAdapter.pauseListing(listingId);
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
          await metahubAdapter.unpauseListing(listingId);
        });

        it('should unpause listing', async () => {
          const listingInfo = await listingManager.listingInfo(listingId);
          expect(listingInfo.paused).toBe(false);
        });
      });
    });

    describe('listing', () => {
      it('should return listing info', async () => {
        const listingInfo = await metahubAdapter.listing(listingId);
        expect(listingInfo.maxLockPeriod).toBe(GLOBAL_MAX_LOCK_PERIOD);
        expect(listingInfo.lockedTill).toBe(0);
        expect(listingInfo.immediatePayout).toBe(false);
        expect(listingInfo.enabled).toBe(true);
        expect(listingInfo.paused).toBe(false);
        expect(listingInfo.id).toMatchObject(listingId);
        expect(listingInfo.lister.address).toBe(lister.address);
      });
    });

    describe('listingCount', () => {
      it('should return listing count', async () => {
        const count = await metahubAdapter.listingCount();
        expect(count.toNumber()).toBe(1);
      });
    });

    describe('listings', () => {
      it('should return a list of listings', async () => {
        const listing = await metahubAdapter.listing(listingId);
        const listings = await metahubAdapter.listings(0, 1);
        expect(listings[0]).toMatchObject(listing);
      });
    });

    describe('userListingCount', () => {
      describe('when user has no listings', () => {
        it('should return 0', async () => {
          const count = await metahubAdapter.userListingCount(toAccountId(deployer.address));
          expect(count.toNumber()).toBe(0);
        });
      });

      describe('when user has listings', () => {
        it('should return the number of listings user has', async () => {
          const count = await metahubAdapter.userListingCount(toAccountId(lister.address));
          expect(count.toNumber()).toBe(1);
        });
      });
    });

    describe('userListings', () => {
      it('should return a list of user listings', async () => {
        const listing = await metahubAdapter.listing(listingId);
        const listings = await metahubAdapter.userListings(toAccountId(lister.address), 0, 1);
        expect(listings[0]).toMatchObject(listing);
      });
    });

    describe('assetListingCount', () => {
      it('should return the number of listings for the asset type', async () => {
        const count = await metahubAdapter.assetListingCount(assetType);
        expect(count.toNumber()).toBe(1);
      });
    });

    describe('assetListings', () => {
      it('should return a list of asset type listings', async () => {
        const listing = await metahubAdapter.listing(listingId);
        const listings = await metahubAdapter.assetListings(assetType, 0, 1);
        expect(listings[0]).toMatchObject(listing);
      });
    });
  });
});
