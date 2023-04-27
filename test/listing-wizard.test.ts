import {
  buildDelegatedListingDataV1,
  buildDelegatedListingPrimaryTypeV1,
  buildExtendedDelegatedListingDataV1,
  buildExtendedDelegatedListingPrimaryTypeV1,
  LISTING_STRATEGY_IDS,
  makeERC721Assets,
  makeFixedRateListingTermsFromUnconverted,
  makeFixedRateWithRewardListingTermsFromUnconverted,
  prepareTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol';
import {
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry,
  IListingWizardV1,
} from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BytesLike } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AccountId,
  Asset,
  AssetListingParams,
  AssetType,
  createAsset,
  CreateListingParams,
  DelegatedSignature,
  DelegatedSignatureWithNonce,
  IQSpace,
  ListingExtendedDelegatedSignatureData,
  ListingExtendedDelegatedSignatureVerificationData,
  ListingParams,
  ListingWizardAdapterV1,
} from '../src';
import { setupForListing } from './helpers/setup';
import {
  COMMON_BASE_RATE,
  COMMON_ID,
  COMMON_REWARD_RATE,
  getChainId,
  SECONDS_IN_DAY,
  TEST_BASE_TOKEN_DECIMALS,
  toAccountId,
  createRandomInteger,
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
  let listerAccountId: AccountId;

  const maxLockPeriod = SECONDS_IN_DAY * 7;
  const immediatePayout = true;
  const salt = 'salty';

  const getTermsStrategyId = async (): Promise<string> => {
    const [, termsList] = await listingTermsRegistry.allListingTerms(
      { listingId: COMMON_ID, universeId: COMMON_ID, warperAddress: warperReference.assetName.reference },
      0,
      1,
    );

    return termsList[0].strategyId;
  };

  const getDelegatedListingSignature = async (): Promise<BytesLike> => {
    const data = await listingWizardAdapter.createDelegatedListingSignature();
    return data.delegatedSignature.signatureEncodedForProtocol;
  };

  const createAssets = (idMin: number, idMax: number): Asset[] => {
    const assets: Asset[] = [];

    for (let i = idMin; i <= idMax; i++) {
      assets.push(createAsset('erc721', toAccountId(collection.address), i));
    }

    return assets;
  };

  const createListingsParams = (totalAssetCount: number, maxAssetCountPerListing = 5): CreateListingParams[] => {
    const params: CreateListingParams[] = [];
    let assetsUsed = 0;
    let assetsLeft = totalAssetCount;

    while (assetsLeft > 0) {
      let assetCount = createRandomInteger(1, maxAssetCountPerListing);
      if (assetsLeft < assetCount) {
        assetCount = 1;
      }

      const assets = createAssets(assetsUsed + 1, assetsUsed + assetCount);
      const assetListingParams = {
        assets,
        params: listingParams,
        maxLockPeriod,
        immediatePayout: true,
      };
      params.push({ universeId: COMMON_ID, assetListingParams, listingTerms });

      assetsUsed += assetCount;
      assetsLeft = totalAssetCount - assetsUsed;
    }

    return params;
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

    listingTerms = makeFixedRateListingTermsFromUnconverted(COMMON_BASE_RATE, TEST_BASE_TOKEN_DECIMALS);
    listingTermsWithReward = makeFixedRateWithRewardListingTermsFromUnconverted(
      COMMON_BASE_RATE,
      COMMON_REWARD_RATE,
      TEST_BASE_TOKEN_DECIMALS,
    );
    listingParams = { lister: toAccountId(lister.address), configurator: toAccountId(ethers.constants.AddressZero) };
    assetListingParams = {
      assets: [createAsset('erc721', toAccountId(collection.address), 1)],
      params: listingParams,
      maxLockPeriod,
      immediatePayout: true,
    };
    listerAccountId = toAccountId(lister.address);
  });

  describe('createListingWithTerms', () => {
    let estimate: BigNumber;
    let gasUsed: BigNumber;

    describe('with fixed rate', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
        estimate = await listingWizardAdapter.estimateCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTerms,
        );
        const tx = await listingWizardAdapter.createListingWithTerms(COMMON_ID, assetListingParams, listingTerms);
        const receipt = await tx.wait();
        gasUsed = receipt.gasUsed;
      });

      it('should create listing with fixed rate', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).to.be.eq(LISTING_STRATEGY_IDS.FIXED_RATE);
        expect(listing.lister).to.be.eq(listingParams.lister.address);
        expect(listing.configurator).to.be.eq(listingParams.configurator.address);
        expect(listing.maxLockPeriod).to.be.eq(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).to.be.eq(assetListingParams.immediatePayout);
        expect(estimate).to.be.greaterThan(gasUsed);
      });
    });

    describe('with fixed rate and reward', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing(true));
        estimate = await listingWizardAdapter.estimateCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTermsWithReward,
        );
        const tx = await listingWizardAdapter.createListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTermsWithReward,
        );
        const receipt = await tx.wait();
        gasUsed = receipt.gasUsed;
      });

      it('should create listing with fixed rate and reward', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).to.be.eq(LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD);
        expect(listing.lister).to.be.eq(listingParams.lister.address);
        expect(listing.configurator).to.be.eq(listingParams.configurator.address);
        expect(listing.maxLockPeriod).to.be.eq(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).to.be.eq(assetListingParams.immediatePayout);
        expect(estimate).to.be.greaterThan(gasUsed);
      });
    });
  });

  describe('createListingsWithTerms (TODO)', function () {
    describe('happy path', () => {
      let txCount: number;
      let listingCount: number;
      const totalAssetCount = 20;

      beforeEach(async function () {
        this.timeout(200000);

        ({ warperReference } = await setupForListing(false, totalAssetCount));

        const listings = createListingsParams(totalAssetCount);
        listingCount = listings.length;

        const transactions = await listingWizardAdapter.createListingsWithTerms(listings);
        txCount = transactions.length;
      });

      it('should create multiple listings with transaction count less than listing count', async () => {
        const actualListingCount = await listingManager.listingCount();
        expect(actualListingCount).to.eq(BigNumber.from(listingCount));
        expect(txCount).to.be.lt(listingCount);
      });
    });
  });

  describe('delegatedCreateListingWithTerms', () => {
    let estimate: BigNumber;
    let gasUsed: BigNumber;

    describe('with fixed rate', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
        estimate = await listingWizardAdapterStranger.estimateDelegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTerms,
          await getDelegatedListingSignature(),
        );
        const tx = await listingWizardAdapterStranger.delegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTerms,
          await getDelegatedListingSignature(),
        );
        const receipt = await tx.wait();
        gasUsed = receipt.gasUsed;
      });

      it('should create listing with fixed rate', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).to.be.eq(LISTING_STRATEGY_IDS.FIXED_RATE);
        expect(listing.lister).to.be.eq(listingParams.lister.address);
        expect(listing.configurator).to.be.eq(listingParams.configurator.address);
        expect(listing.maxLockPeriod).to.be.eq(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).to.be.eq(assetListingParams.immediatePayout);
        expect(estimate).to.be.greaterThan(gasUsed);
      });
    });

    describe('with fixed rate and reward', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing(true));
        estimate = await listingWizardAdapterStranger.estimateDelegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTermsWithReward,
          await getDelegatedListingSignature(),
        );
        const tx = await listingWizardAdapterStranger.delegatedCreateListingWithTerms(
          COMMON_ID,
          assetListingParams,
          listingTermsWithReward,
          await getDelegatedListingSignature(),
        );
        const receipt = await tx.wait();
        gasUsed = receipt.gasUsed;
      });

      it('should create listing with fixed rate and reward', async () => {
        const listing = await listingManager.listingInfo(COMMON_ID);
        const strategyId = await getTermsStrategyId();

        expect(strategyId).to.be.eq(LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD);
        expect(listing.lister).to.be.eq(listingParams.lister.address);
        expect(listing.configurator).to.be.eq(listingParams.configurator.address);
        expect(listing.maxLockPeriod).to.be.eq(assetListingParams.maxLockPeriod);
        expect(listing.immediatePayout).to.be.eq(assetListingParams.immediatePayout);
        expect(estimate).to.be.greaterThan(gasUsed);
      });
    });
  });

  describe('createDelegatedListingSignature', () => {
    let premadeSignature1: DelegatedSignatureWithNonce;
    let premadeSignature2: DelegatedSignatureWithNonce;

    beforeEach(async () => {
      premadeSignature1 = {
        nonce: BigNumber.from(0),
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildDelegatedListingDataV1(BigNumber.from(0)),
          buildDelegatedListingPrimaryTypeV1(),
          lister,
          getChainId().reference,
          listingWizard.address,
        ),
      };

      premadeSignature2 = {
        nonce: BigNumber.from(1),
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildDelegatedListingDataV1(BigNumber.from(1)),
          buildDelegatedListingPrimaryTypeV1(),
          lister,
          getChainId().reference,
          listingWizard.address,
        ),
      };
    });

    it('should create a signature', async () => {
      const signature1 = await listingWizardAdapter.createDelegatedListingSignature();
      const signature2 = await listingWizardAdapter.createDelegatedListingSignature(premadeSignature2.nonce);

      expect(signature1).to.deep.eq(premadeSignature1);
      expect(signature2).to.deep.eq(premadeSignature2);
    });
  });

  describe('verifyDelegatedListingSignature', () => {
    describe('if nonce has not changed', () => {
      it('should return true', async () => {
        const signature = await listingWizardAdapter.createDelegatedListingSignature();
        expect(
          await listingWizardAdapter.verifyDelegatedListingSignature(
            listerAccountId,
            signature.delegatedSignature.signature,
          ),
        ).to.eq(true);
      });
    });

    describe('if nonce has changed', () => {
      it('should return false', async () => {
        const signature = await listingWizardAdapter.createDelegatedListingSignature();
        expect(
          await listingWizardAdapter.verifyDelegatedListingSignature(
            listerAccountId,
            signature.delegatedSignature.signature,
            BigNumber.from(28),
          ),
        ).to.eq(false);
      });
    });
  });

  describe('createExtendedDelegatedListingSignature', () => {
    let firstSignature: DelegatedSignature;
    let secondSignature: DelegatedSignatureWithNonce;
    const nonce = BigNumber.from(0);

    beforeEach(async () => {
      firstSignature = await prepareTypedDataActionEip712SignatureV1(
        buildDelegatedListingDataV1(BigNumber.from(0)),
        buildDelegatedListingPrimaryTypeV1(),
        lister,
        getChainId().reference,
        listingWizard.address,
      );
      secondSignature = {
        nonce,
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildExtendedDelegatedListingDataV1(
            salt,
            nonce,
            makeERC721Assets(collection.address, [1]),
            { lister: lister.address, configurator: ethers.constants.AddressZero },
            listingTerms,
            maxLockPeriod,
            immediatePayout,
            COMMON_ID,
            firstSignature.signatureEncodedForProtocol,
          ),
          buildExtendedDelegatedListingPrimaryTypeV1(),
          lister,
          getChainId().reference,
          listingWizard.address,
        ),
      };
    });

    it('should create a signature', async () => {
      const signatureWithoutNonce = await listingWizardAdapter.createExtendedDelegatedListingSignature({
        universeId: COMMON_ID,
        assetListingParams,
        listingTerms,
        salt,
      });
      const signatureWithNonce = await listingWizardAdapter.createExtendedDelegatedListingSignature(
        {
          universeId: COMMON_ID,
          assetListingParams,
          listingTerms,
          salt,
        },
        { nonce, delegatedSignature: firstSignature },
      );

      expect(signatureWithoutNonce).to.deep.eq(signatureWithNonce);
      expect(signatureWithoutNonce).to.deep.eq(secondSignature.delegatedSignature);
    });
  });

  describe('verifyExtendedDelegatedListingSignature', () => {
    let signatureData: ListingExtendedDelegatedSignatureData;
    let signatureVerificationData: ListingExtendedDelegatedSignatureVerificationData;
    let signature: DelegatedSignatureWithNonce;
    let extendedSignature: DelegatedSignature;

    beforeEach(async () => {
      signatureData = {
        universeId: COMMON_ID,
        assetListingParams,
        listingTerms,
        salt,
      };

      signature = await listingWizardAdapter.createDelegatedListingSignature();
      extendedSignature = await listingWizardAdapter.createExtendedDelegatedListingSignature(signatureData, signature);

      signatureVerificationData = {
        ...signatureData,
        delegatedSignatureWithNonce: signature,
      };
    });

    describe('if data has not changed', () => {
      it('should return true', async () => {
        expect(
          await listingWizardAdapter.verifyExtendedDelegatedListingSignature(
            listerAccountId,
            signatureVerificationData,
            extendedSignature.signature,
          ),
        ).to.eq(true);
      });
    });

    describe('if data has changed', () => {
      it('should return false', async () => {
        expect(
          await listingWizardAdapter.verifyExtendedDelegatedListingSignature(
            listerAccountId,
            { ...signatureVerificationData, universeId: BigNumber.from(30) },
            extendedSignature.signature,
          ),
        ).to.eq(false);
      });
    });
  });
});
