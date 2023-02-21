import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import {
  AssetListingParams,
  AssetType,
  calculateBaseRateInBaseTokenEthers,
  createAsset,
  IQSpace,
  ListingParams,
  ListingWizardAdapterV1,
  LISTING_STRATEGY_IDS,
  makeListingTermsFixedRate,
  makeListingTermsFixedRateWithReward,
} from '../src';
import { ERC721Mock, IListingManager, IListingTermsRegistry, IListingWizardV1, IMetahub } from '../src/contracts';
import { setupForListing } from './helpers/setup';
import {
  COMMON_BASE_RATE,
  COMMON_ID,
  COMMON_PRICE,
  COMMON_REWARD_RATE,
  SECONDS_IN_DAY,
  toAccountId,
} from './helpers/utils';

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
  let listingTermsRegistry: IListingTermsRegistry;
  let metahub: IMetahub;
  let collection: ERC721Mock;

  /** SDK */
  let iqspace: IQSpace;
  let listingWizardAdapter: ListingWizardAdapterV1;

  /** Data Structs */
  let pricePerSecondInEthers: string;
  let listingTerms: IListingTermsRegistry.ListingTermsStruct;
  let listingTermsWithReward: IListingTermsRegistry.ListingTermsStruct;
  let listingParams: ListingParams;
  let assetListingParams: AssetListingParams;
  let warperReference: AssetType;

  const getTermsStrategyId = async (): Promise<string> => {
    const [, termsList] = await listingTermsRegistry.allListingTerms(
      { listingId: COMMON_ID, universeId: COMMON_ID, warperAddress: warperReference.assetName.reference },
      0,
      1,
    );

    return termsList[0].strategyId;
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingWizard = await ethers.getContract('ListingWizardV1');
    listingManager = await ethers.getContract('ListingManager');
    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');
    metahub = await ethers.getContract('Metahub');
    collection = await ethers.getContract('ERC721Mock');

    iqspace = await IQSpace.init({ signer: lister });
    listingWizardAdapter = iqspace.listingWizardV1(toAccountId(listingWizard.address));

    pricePerSecondInEthers = calculateBaseRateInBaseTokenEthers(COMMON_PRICE, SECONDS_IN_DAY);
    listingTerms = makeListingTermsFixedRate(COMMON_BASE_RATE);
    listingTermsWithReward = makeListingTermsFixedRateWithReward(COMMON_BASE_RATE, COMMON_REWARD_RATE);
    listingParams = { lister: toAccountId(lister.address), configurator: toAccountId(ethers.constants.AddressZero) };
    assetListingParams = {
      assets: [createAsset('erc721', toAccountId(collection.address), 1)],
      params: listingParams,
      maxLockPeriod: SECONDS_IN_DAY * 7,
      immediatePayout: true,
    };
  });

  describe('createListingWithTerms', () => {
    describe('with fixed rate', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
        await listingWizardAdapter.createListingWithTerms(1, assetListingParams, listingTerms);
      });

      it('should create listing with fixed rate', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).toBe(LISTING_STRATEGY_IDS.FIXED_RATE);
        expect(listing.lister).toBe(listingParams.lister.address);
        expect(listing.configurator).toBe(listingParams.configurator.address);
        expect(listing.maxLockPeriod).toBe(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).toBe(assetListingParams.immediatePayout);
      });
    });

    describe('with fixed rate and reward', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing(true));
        await listingWizardAdapter.createListingWithTerms(1, assetListingParams, listingTermsWithReward);
      });

      it('should create listing with fixed rate and reward', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).toBe(LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD);
        expect(listing.lister).toBe(listingParams.lister.address);
        expect(listing.configurator).toBe(listingParams.configurator.address);
        expect(listing.maxLockPeriod).toBe(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).toBe(assetListingParams.immediatePayout);
      });
    });
  });
});
