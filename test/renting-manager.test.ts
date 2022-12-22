import {
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
  LISTING_STRATEGY_IDS,
} from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { ListingManagerAdapter, Multiverse, RentingManagerAdapter } from '../src';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721Mock,
  ERC721Mock__factory,
  IACL,
  IListingManager,
  IListingStrategyRegistry,
  IListingTermsRegistry,
  IMetahub,
  IRentingManager,
  ITaxTermsRegistry,
  IUniverseRegistry,
  IWarperManager,
  IWarperPresetFactory,
} from '../src/contracts';
import { Assets } from '../src/contracts/contracts/listing/listing-manager/ListingManager';
import { grantRoles } from './helpers/acl';
import { createAssetReference, makeERC721Asset, mintAndApproveNFTs } from './helpers/asset';
import { toAccountId } from './helpers/caip';
import { calculateBaseRate, SECONDS_IN_DAY } from './helpers/general';
import { createListing, makeListingTermsFixedRate } from './helpers/listing';
import { makeTaxTermsFixedRate } from './helpers/tax';
import { createUniverse } from './helpers/universe';
import { createAndRegisterWarper } from './helpers/warper';

/**
 * @group integration
 */
describe('RentingManagerAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;

  /** Contracts */
  let acl: IACL;
  let metahub: IMetahub;
  let listingManager: IListingManager;
  let rentingManager: IRentingManager;
  let universeRegistry: IUniverseRegistry;
  let warperPresetFactory: IWarperPresetFactory;
  let warperManager: IWarperManager;
  let listingTermsRegistry: IListingTermsRegistry;
  let listingStrategyRegistry: IListingStrategyRegistry;
  let taxTermsRegistry: ITaxTermsRegistry;

  /** SDK */
  let multiverse: Multiverse;
  let listingManagerAdapter: ListingManagerAdapter;
  let rentingManagerAdapter: RentingManagerAdapter;

  /** Mocks & Samples */
  let nft: ERC721Mock;
  let baseToken: ERC20Mock;

  /** Constants */
  const listingId = BigNumber.from(1);
  const listingTermsId = BigNumber.from(1);
  const universeId = BigNumber.from(1);

  /** Data Structs */
  let listingAssets: Assets.AssetStruct[];
  let listingTerms: IListingTermsRegistry.ListingTermsStruct;
  let warperReference: AssetType;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    admin = await ethers.getNamedSigner('admin');
    lister = await ethers.getNamedSigner('assetOwner');

    [renter] = await ethers.getUnnamedSigners();

    acl = await ethers.getContract('ACL');
    metahub = await ethers.getContract('Metahub');
    listingManager = await ethers.getContract('ListingManager');
    rentingManager = await ethers.getContract('RentingManager');
    universeRegistry = await ethers.getContract('UniverseRegistry');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    warperManager = await ethers.getContract('WarperManager');
    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');
    listingStrategyRegistry = await ethers.getContract('ListingStrategyRegistry');
    taxTermsRegistry = await ethers.getContract('TaxTermsRegistry');

    nft = new ERC721Mock__factory().attach('0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901');
    baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    multiverse = await Multiverse.init({ signer: lister });
    listingManagerAdapter = multiverse.listingManager(toAccountId(listingManager.address));
    rentingManagerAdapter = multiverse.rentingManager(toAccountId(rentingManager.address));

    listingAssets = [makeERC721Asset(nft.address, 1)];

    await grantRoles(lister.address, deployer.address);
    await mintAndApproveNFTs(nft, lister);
    await createUniverse(baseToken);
    warperReference = await createAndRegisterWarper(nft, multiverse, universeId);

    await createListing(lister, listingAssets);
    const baseRate = calculateBaseRate('100', SECONDS_IN_DAY);
    listingTerms = makeListingTermsFixedRate(baseRate);
    await listingTermsRegistry.connect(lister).registerUniverseListingTerms(listingId, universeId, listingTerms);
    await taxTermsRegistry.registerProtocolGlobalTaxTerms(makeTaxTermsFixedRate('1'));
    await taxTermsRegistry.registerUniverseWarperTaxTerms(
      universeId,
      warperReference.assetName.reference,
      makeTaxTermsFixedRate('1'),
    );
  }, 20000);

  describe('estimateRent', () => {
    it('should estimate rent', async () => {
      const estimate = await rentingManagerAdapter.estimateRent({
        warper: warperReference,
        renter: toAccountId(renter.address),
        paymentToken: createAssetReference('erc20', baseToken.address),
        listingId,
        rentalPeriod: 1,
        listingTermsId,
        selectedConfiguratorListingTerms: { strategyId: EMPTY_BYTES4_DATA_HEX, strategyData: EMPTY_BYTES_DATA_HEX },
      });
      console.log(estimate);
    });
  });
});
