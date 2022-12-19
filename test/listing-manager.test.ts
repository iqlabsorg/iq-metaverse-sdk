import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, ChainId } from 'caip';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721AssetController,
  ERC721AssetVault__factory,
  ERC721Mock,
  ERC721Mock__factory,
  ERC721WarperController__factory,
  IACL,
  IAssetClassRegistry,
  IListingManager,
  IUniverseRegistry,
} from '../src/contracts';
import { MetahubAdapter, Multiverse } from '../src';
import { Assets, Listings } from '../src/contracts/contracts/listing/listing-manager/ListingManager';
import { makeERC721Asset, makeListingParams, makeUniverseParams, toAccountId } from './utils';
import { ASSET_CLASS, ROLES_LIBRARY_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';

/**
 * @group unit
 */
describe('ListingManagerAdapter (via MetahubAdapter)', () => {
  /** Signers */
  let admin: SignerWithAddress;
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let nftCreator: SignerWithAddress;
  let randomAddress: SignerWithAddress;

  /** Contracts */
  let listingManager: IListingManager;
  let acl: IACL;
  let universeRegistry: IUniverseRegistry;
  let assetClassRegistry: IAssetClassRegistry;

  /** SDK */
  let multiverse: Multiverse;
  let metahub: MetahubAdapter;

  /** Mocks & Samples */
  let nft: ERC721Mock;
  let baseToken: ERC20Mock;

  /** Constants */
  const GLOBAL_MAX_LOCK_PERIOD = 3600;
  const GLOBAL_IMMEDIATE_PAYOUT = false;
  const listingId = BigNumber.from(1);

  /** Data Structs */
  let listingParams: Listings.ParamsStruct;
  let multipleAssets: Array<Assets.AssetStruct>;
  let singleAsset: Array<Assets.AssetStruct>;
  let universeParams: IUniverseRegistry.UniverseParamsStruct;

  beforeAll(async () => {
    await deployments.fixture();

    admin = await ethers.getNamedSigner('admin');
    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');
    nftCreator = await ethers.getNamedSigner('nftCreator');
    [randomAddress] = await ethers.getUnnamedSigners();

    const metahubContract = await ethers.getContract('Metahub');
    listingManager = await ethers.getContract('ListingManager');
    acl = await ethers.getContract('ACL');
    universeRegistry = await ethers.getContract('UniverseRegistry');
    assetClassRegistry = await ethers.getContract('AssetClassRegistry');
    // nft = await ethers.getContract('ERC721Mock');
    nft = new ERC721Mock__factory().attach('0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901');
    baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    multiverse = await Multiverse.init({ signer: deployer });
    metahub = await multiverse.metahub(toAccountId(metahubContract.address));

    listingParams = makeListingParams(lister.address);
    multipleAssets = [makeERC721Asset(nft.address, 1), makeERC721Asset(nft.address, 2)];
    singleAsset = [makeERC721Asset(nft.address, 1)];
    universeParams = makeUniverseParams('Test Universe', [baseToken.address]);

    for (let i = 1; i < 5; i++) {
      await nft.connect(nftCreator).mint(lister.address, i);
    }

    await nft.connect(lister).setApprovalForAll(metahubContract.address, true);

    await acl.grantRole(ROLES_LIBRARY_IDS.ADMIN_ROLE, admin.address);
    await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, lister.address);
    await acl.grantRole(ROLES_LIBRARY_IDS.UNIVERSE_WIZARD_ROLE, deployer.address);

    await universeRegistry.createUniverse(universeParams);

    // asset registry ? looks like already created on initial deployment..
    // const warperController = new ERC721WarperController__factory().attach('0x04C89607413713Ec9775E14b954286519d836FEf');
    // const assetVault = new ERC721AssetVault__factory().attach('0x1fA02b2d6A771842690194Cf62D91bdd92BfE28d');
    // await assetClassRegistry.connect(admin).registerAssetClass(ASSET_CLASS.ERC721, {
    //   controller: warperController.address,
    //   vault: assetVault.address,
    // });

    // warper ?
  }, 20000);

  describe('when listing has been created', () => {
    it('?', () => console.log('todo'));
    beforeEach(async () => {
      await listingManager
        .connect(lister)
        .createListing(singleAsset, listingParams, GLOBAL_MAX_LOCK_PERIOD, GLOBAL_IMMEDIATE_PAYOUT);
    });

    // describe('disableListing', () => {
    //   it('should disable listing', async () => {
    //     const listingData = await metahub.listing(listingId);
    //     console.log('LISTING:\n', listingData);
    //   });
    // });
  });
});
