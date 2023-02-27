import {
  buildDelegatedListingDataV1,
  LISTING_STRATEGY_IDS,
  makeFixedRateListingTermsFromUnconverted,
  makeFixedRateWithRewardListingTermsFromUnconverted,
  prepareTypedDataActionEip712Signature,
} from '@iqprotocol/iq-space-protocol';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BytesLike } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { AssetListingParams, AssetType, createAsset, IQSpace, ListingParams, ListingWizardAdapterV1 } from '../src';
import { ERC721Mock, IListingManager, IListingTermsRegistry, IListingWizardV1 } from '../src/contracts';
import { setupForListing } from './helpers/setup';
import {
  COMMON_BASE_RATE,
  COMMON_ID,
  COMMON_REWARD_RATE,
  getChainId,
  SECONDS_IN_DAY,
  toAccountId,
} from './helpers/utils';

/**
 * @group integration
 */
describe('ListingWizardAdapterV1', () => {
  /** Signers */
  let lister: SignerWithAddress;
  let stranger: SignerWithAddress;

  /** Contracts */
  let listingWizard: IListingWizardV1;
  let listingManager: IListingManager;
  let listingTermsRegistry: IListingTermsRegistry;
  let collection: ERC721Mock;

  /** SDK */
  let listingWizardAdapter: ListingWizardAdapterV1;
  let listingWizardAdapterStranger: ListingWizardAdapterV1;

  /** Data Structs */
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

  const getDelegatedListingSignature = async (): Promise<BytesLike> => {
    const delegatedListingCurrentNonce = await listingWizardAdapter.getDelegatedListingCurrentNonce(
      toAccountId(lister.address),
    );
    return await prepareTypedDataActionEip712Signature(
      buildDelegatedListingDataV1(delegatedListingCurrentNonce),
      lister,
      getChainId().reference,
      listingWizard.address,
    );
  };

  beforeEach(async () => {
    await deployments.fixture();

    lister = await ethers.getNamedSigner('assetOwner');
    [stranger] = await ethers.getUnnamedSigners();

    listingWizard = await ethers.getContract('ListingWizardV1');
    listingManager = await ethers.getContract('ListingManager');
    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');
    collection = await ethers.getContract('ERC721Mock');

    const iqSpaceLister = await IQSpace.init({ signer: lister });
    const iqSpaceStranger = await IQSpace.init({ signer: stranger });
    listingWizardAdapter = iqSpaceLister.listingWizardV1(toAccountId(listingWizard.address));
    listingWizardAdapterStranger = iqSpaceStranger.listingWizardV1(toAccountId(listingWizard.address));

    listingTerms = makeFixedRateListingTermsFromUnconverted(COMMON_BASE_RATE);
    listingTermsWithReward = makeFixedRateWithRewardListingTermsFromUnconverted(COMMON_BASE_RATE, COMMON_REWARD_RATE);
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
        await listingWizardAdapter.createListingWithTerms(COMMON_ID, assetListingParams, listingTermsWithReward);
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

  describe('delegatedCreateListingWithTerms', () => {
    describe('with fixed rate', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
        await listingWizardAdapterStranger.delegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTerms,
          await getDelegatedListingSignature(),
        );
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
        await listingWizardAdapterStranger.delegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTermsWithReward,
          await getDelegatedListingSignature(),
        );
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
