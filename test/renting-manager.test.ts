import { BASE_TOKEN_DECIMALS, convertToWei } from '@iqprotocol/iq-space-protocol';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType } from 'caip';
import { deployments, ethers } from 'hardhat';
import { AddressTranslator, Asset, createAsset, IQSpace, RentingEstimationParams, RentingManagerAdapter } from '../src';
import { ERC20Mock, IMetahub, IRentingManager } from '../src/contracts';
import { setupForRenting } from './helpers/setup';
import { COMMON_ID, SECONDS_IN_HOUR, toAccountId, waitBlockchainTime } from './helpers/utils';

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
  let iqspace: IQSpace;
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
      listingTermsId: COMMON_ID,
    });
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [renter] = await ethers.getUnnamedSigners();

    metahub = await ethers.getContract('Metahub');
    rentingManager = await ethers.getContract('RentingManager');
    baseToken = await ethers.getContract('ERC20Mock');

    iqspace = await IQSpace.init({ signer: renter });
    rentingManagerAdapter = iqspace.rentingManager(toAccountId(rentingManager.address));

    ({ warperReference } = await setupForRenting());
    baseTokenReference = AddressTranslator.createAssetType(toAccountId(baseToken.address), 'erc20');
    renterAccountId = toAccountId(renter.address);

    await baseToken.connect(deployer).mint(renter.address, convertToWei('1000', BASE_TOKEN_DECIMALS));

    rentingEstimationParams = {
      warper: warperReference,
      renter: renterAccountId,
      paymentToken: baseTokenReference,
      listingId: COMMON_ID,
      rentalPeriod,
      listingTermsId: COMMON_ID,
    };

    warpedAsset = createAsset('erc721', toAccountId(warperReference.assetName.reference), 1);
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
    describe('when asset has never been rented', () => {
      it('should return rental status `none`', async () => {
        const status = await rentingManagerAdapter.assetRentalStatus(warpedAsset);
        expect(status).toBe('none');
      });
    });

    describe('when asset has been rented in the past but is not being rented now', () => {
      beforeEach(async () => {
        await rentAsset();
        await waitBlockchainTime(rentalPeriod + 1000);
      });

      it('should return rental status `available`', async () => {
        const status = await rentingManagerAdapter.assetRentalStatus(warpedAsset);
        expect(status).toBe('available');
      });
    });

    describe('when asset is currenlty being rented', () => {
      beforeEach(async () => {
        await rentAsset();
      });

      it('should return rental status `rented`', async () => {
        const status = await rentingManagerAdapter.assetRentalStatus(warpedAsset);
        expect(status).toBe('rented');
      });
    });
  });
});
