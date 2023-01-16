import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import {
  AssetListingParams,
  calculatePricePerSecondInEthers,
  createAsset,
  IQSpace,
  ListingParams,
  ListingTerms,
  ListingWizardAdapterV1,
  LISTING_STRATEGIES,
} from '../src';
import { ERC721Mock, IListingManager, IListingWizardV1, IMetahub } from '../src/contracts';
import { setupForListing } from './helpers/setup';
import { COMMON_ID, SECONDS_IN_DAY, toAccountId } from './helpers/utils';

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
  let iqspace: IQSpace;
  let listingWizardAdapter: ListingWizardAdapterV1;

  /** Data Structs */
  let pricePerSecondInEthers: string;
  let listingTerms: ListingTerms;
  let listingParams: ListingParams;
  let assetListingParams: AssetListingParams;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingWizard = await ethers.getContract('ListingWizardV1');
    listingManager = await ethers.getContract('ListingManager');
    metahub = await ethers.getContract('Metahub');
    collection = await ethers.getContract('ERC721Mock');

    iqspace = await IQSpace.init({ signer: lister });
    listingWizardAdapter = iqspace.listingWizardV1(toAccountId(listingWizard.address));

    await setupForListing();

    pricePerSecondInEthers = calculatePricePerSecondInEthers('100', SECONDS_IN_DAY);
    listingTerms = { name: LISTING_STRATEGIES.FIXED_RATE, data: { pricePerSecondInEthers } };
    listingParams = { lister: toAccountId(lister.address), configurator: toAccountId(ethers.constants.AddressZero) };
    assetListingParams = {
      assets: [createAsset('erc721', toAccountId(collection.address), 1)],
      params: listingParams,
      maxLockPeriod: SECONDS_IN_DAY * 7,
      immediatePayout: true,
    };
  });

  describe('createListingWithTerms', () => {
    beforeEach(async () => {
      await listingWizardAdapter.createListingWithTerms(1, assetListingParams, listingTerms);
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
