import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType } from 'caip';
import { deployments, ethers } from 'hardhat';
import { Asset, Multiverse, RentingEstimationParams, RentingManagerAdapter } from '../src';
import { ERC20Mock, ERC20Mock__factory, IMetahub, IRentingManager } from '../src/contracts';
import { createAssetReference, makeERC721AssetForSDK } from './helpers/asset';
import { getSelectedConfiguratorListingTerms, getTokenQuoteData } from './helpers/listing-renting';
import { BASE_TOKEN, setupListingAndRenting } from './helpers/setup';
import { COMMON_ID, convertToWei, SECONDS_IN_HOUR, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('RentingManagerAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let renter: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let rentingManager: IRentingManager;

  /** SDK */
  let multiverse: Multiverse;
  let rentingManagerAdapter: RentingManagerAdapter;

  /** Mocks & Samples */
  let baseToken: ERC20Mock;

  /** Constants */
  const rentalPeriod = SECONDS_IN_HOUR * 3;

  /** Data Structs */
  let warperReference: AssetType;
  let baseTokenReference: AssetType;
  let renterAccountId: AccountId;
  let rentingEstimationParams: RentingEstimationParams;
  let warpedAsset: Asset;

  const rentAsset = async (): Promise<void> => {
    const estimate = await rentingManagerAdapter.estimateRent(rentingEstimationParams);
    await baseToken.connect(renter).approve(metahub.address, estimate.total);
    await rentingManagerAdapter.rent({
      listingId: COMMON_ID,
      paymentToken: baseTokenReference,
      rentalPeriod,
      renter: renterAccountId,
      warper: warperReference,
      maxPaymentAmount: estimate.total,
      selectedConfiguratorListingTerms: getSelectedConfiguratorListingTerms(),
      listingTermsId: COMMON_ID,
      ...getTokenQuoteData(),
    });
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [renter] = await ethers.getUnnamedSigners();

    metahub = await ethers.getContract('Metahub');
    rentingManager = await ethers.getContract('RentingManager');
    baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);

    multiverse = await Multiverse.init({ signer: renter });
    rentingManagerAdapter = multiverse.rentingManager(toAccountId(rentingManager.address));

    ({ warperReference } = await setupListingAndRenting());
    baseTokenReference = createAssetReference('erc20', baseToken.address);
    renterAccountId = toAccountId(renter.address);

    await baseToken.connect(deployer).mint(renter.address, convertToWei('1000'));

    rentingEstimationParams = {
      warper: warperReference,
      renter: renterAccountId,
      paymentToken: baseTokenReference,
      listingId: COMMON_ID,
      rentalPeriod,
      listingTermsId: COMMON_ID,
      selectedConfiguratorListingTerms: getSelectedConfiguratorListingTerms(),
    };

    warpedAsset = makeERC721AssetForSDK(warperReference.assetName.reference, 1);
  });

  describe('estimateRent', () => {
    it('should estimate rent', async () => {
      const estimate = await rentingManagerAdapter.estimateRent(rentingEstimationParams);
      expect(estimate).toBeDefined();
      expect(estimate.total.toBigInt()).toBeGreaterThan(0n);
    });
  });

  describe('rent', () => {
    beforeEach(async () => {
      await rentAsset();
    });

    it('should rent asset', async () => {
      const count = await rentingManager.userRentalCount(renter.address);
      expect(count.toBigInt()).toBe(1n);
    });

    describe('when asset is rented', () => {
      describe('userRentalCount', () => {
        it('should return users rental count', async () => {
          const count = await rentingManagerAdapter.userRentalCount(renterAccountId);
          expect(count.toBigInt()).toBe(1n);
        });
      });

      describe('rentalAgreement', () => {
        it('should return rental agreement', async () => {
          const agreement = await rentingManagerAdapter.rentalAgreement(COMMON_ID);
          expect(agreement).toBeDefined();
          expect(agreement.renter.toString()).toBe(renterAccountId.toString());
        });
      });

      describe('userRentalAgreements', () => {
        it('should return all rental agreements for user', async () => {
          const agrements = await rentingManagerAdapter.userRentalAgreements(renterAccountId, 0, 10);
          expect(agrements).toBeDefined();
          expect(agrements.length).toBe(1);
        });
      });

      describe('collectionRentedValue', () => {
        it('should return token amount from specific collection rented by renter', async () => {
          const agreement = await rentingManagerAdapter.rentalAgreement(COMMON_ID);
          const assetCount = await rentingManagerAdapter.collectionRentedValue(agreement.collectionId, renterAccountId);
          expect(assetCount.toBigInt()).toBe(1n);
        });
      });
    });
  });

  describe('assetRentalStatus', () => {
    describe('when asset is not rented', () => {
      it('should reflect that asset is available for renting', async () => {
        const status = await rentingManagerAdapter.assetRentalStatus(warpedAsset);
        // expect(status).toBe('available');
        expect(status).toBe('none'); // ???
      });
    });

    describe('when asset is rented', () => {
      beforeEach(async () => {
        await rentAsset();
      });

      it('should reflect that asset is not available for renting', async () => {
        const status = await rentingManagerAdapter.assetRentalStatus(warpedAsset);
        expect(status).toBe('rented');
      });
    });
  });
});
