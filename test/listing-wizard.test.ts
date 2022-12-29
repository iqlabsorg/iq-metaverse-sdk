import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { AssetListingParams, ListingParams, ListingTerms, ListingWizardAdapterV1, Multiverse } from '../src';
import {
  ERC721Mock,
  ERC721Mock__factory,
  IListingManager,
  IListingWizardV1,
  IMetahub,
  ListingWizardV1__factory,
} from '../src/contracts';
import { makeERC721AssetForSDK } from './helpers/asset';
import { makeListingTermsFixedRate } from './helpers/listing-renting';
import { COLLECTION, LISTING_WIZARD, setupForListing } from './helpers/setup';
import { calculateBaseRate, COMMON_ID, SECONDS_IN_DAY, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ListingWizardAdapterV1', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;

  /** Contracts */
  let listingWizard: IListingWizardV1;
  let listingManager: IListingManager;
  let metahub: IMetahub;
  let collection: ERC721Mock;

  /** SDK */
  let multiverse: Multiverse;
  let listingWizardAdapter: ListingWizardAdapterV1;

  /** Data Structs */
  let baseRate: string;
  let listingTerms: ListingTerms;
  let listingParams: ListingParams;
  let assetListingParams: AssetListingParams;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingWizard = new ListingWizardV1__factory().attach(LISTING_WIZARD).connect(lister);
    listingManager = await ethers.getContract('ListingManager');
    metahub = await ethers.getContract('Metahub');
    collection = new ERC721Mock__factory().attach(COLLECTION);

    multiverse = await Multiverse.init({ signer: lister });
    listingWizardAdapter = multiverse.listingWizardV1(toAccountId(listingWizard.address));

    await setupForListing();

    baseRate = calculateBaseRate('100', SECONDS_IN_DAY);
    listingTerms = makeListingTermsFixedRate(baseRate);
    listingParams = { lister: toAccountId(lister.address), configurator: toAccountId(ethers.constants.AddressZero) };
    assetListingParams = {
      assets: [makeERC721AssetForSDK(collection.address, 1)],
      params: listingParams,
      maxLockPeriod: SECONDS_IN_DAY * 7,
      immediatePayout: true,
    };
  });

  describe('createListingWithTerms', () => {
    beforeEach(async () => {
      await listingWizardAdapter.createListingWithTerms(COMMON_ID, assetListingParams, listingTerms);
    });

    it('should create listing with terms', async () => {
      const listing = await listingManager.listingInfo(COMMON_ID);
      expect(listing.lister).toBe(listingParams.lister.address);
      expect(listing.configurator).toBe(listingParams.configurator.address);
      expect(listing.maxLockPeriod).toBe(assetListingParams.maxLockPeriod);
      expect(listing.immediatePayout).toBe(assetListingParams.immediatePayout);
    });
  });
});
