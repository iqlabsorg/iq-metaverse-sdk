import {
  BASE_TOKEN_DECIMALS,
  buildDelegatedRentDataV1,
  buildDelegatedRentPrimaryTypeV1,
  buildExtendedDelegatedRentDataV1,
  buildExtendedDelegatedRentPrimaryTypeV1,
  convertToWei,
  EMPTY_BYTES_DATA_HEX,
  prepareTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol';
import {
  ERC20Mock,
  IMetahub,
  IRentingManager,
  IRentingWizardV1,
  Rentings,
} from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType } from 'caip';
import { expect } from 'chai';
import { BigNumber, BytesLike } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AddressTranslator,
  Asset,
  AssetCoder,
  createAsset,
  DelegatedSignature,
  DelegatedSignatureWithNonce,
  IQSpace,
  RentalFees,
  RentingEstimationParams,
  RentingExtendedDelegatedSignatureData,
  RentingExtendedDelegatedSignatureVerificationData,
  RentingManagerAdapter,
  RentingWizardAdapterV1,
} from '../src';
import { RentingHelper } from '../src/helpers';
import { setupForRenting } from './helpers/setup';
import { COMMON_ID, getChainId, SECONDS_IN_HOUR, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('RentingWizardAdapterV1', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let renter: SignerWithAddress;
  let delegatedRenter: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let rentingManager: IRentingManager;
  let rentingWizard: IRentingWizardV1;

  /** SDK */
  let rentingManagerAdapterRenter: RentingManagerAdapter;
  let rentingWizardAdapterRenter: RentingWizardAdapterV1;
  let rentingWizardAdapterDelegated: RentingWizardAdapterV1;
  let addressTranslator: AddressTranslator;

  /** Mocks & Samples */
  let baseToken: ERC20Mock;

  /** Constants */
  const rentalPeriod = SECONDS_IN_HOUR * 3;
  const salt = 'salty';

  /** Data Structs */
  let warperReference: AssetType;
  let baseTokenReference: AssetType;
  let renterAccountId: AccountId;
  let rentingEstimationParams: RentingEstimationParams;
  let rentingParams: Rentings.ParamsStruct;
  let warpedAsset: Asset;
  let estimate: RentalFees;

  const getDelegatedRentSignature = async (): Promise<BytesLike> => {
    const data = await rentingWizardAdapterRenter.createDelegatedRentSignature();
    return data.delegatedSignature.signatureEncodedForProtocol;
  };

  const delegateRentAsset = async (): Promise<void> => {
    await baseToken.connect(renter).approve(rentingWizard.address, estimate.total);
    await rentingWizardAdapterDelegated.delegatedRent(
      {
        listingId: COMMON_ID,
        paymentToken: baseTokenReference,
        rentalPeriod,
        renter: renterAccountId,
        warper: warperReference,
        maxPaymentAmount: estimate.total,
        listingTermsId: COMMON_ID,
      },
      await getDelegatedRentSignature(),
    );
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [renter, delegatedRenter] = await ethers.getUnnamedSigners();

    rentingManager = await ethers.getContract('RentingManager');
    rentingWizard = await ethers.getContract('RentingWizardV1');
    metahub = await ethers.getContract('Metahub');
    baseToken = await ethers.getContract('ERC20Mock');

    const renterIQSpace = await IQSpace.init({ signer: renter });
    const delegatedIQSpace = await IQSpace.init({ signer: delegatedRenter });
    rentingManagerAdapterRenter = renterIQSpace.rentingManager(toAccountId(rentingManager.address));
    rentingWizardAdapterDelegated = delegatedIQSpace.rentingWizardV1(toAccountId(rentingWizard.address));
    rentingWizardAdapterRenter = renterIQSpace.rentingWizardV1(toAccountId(rentingWizard.address));

    baseTokenReference = AddressTranslator.createAssetType(toAccountId(baseToken.address), 'erc20');
    renterAccountId = toAccountId(renter.address);

    await baseToken.connect(deployer).mint(renter.address, convertToWei('100', BASE_TOKEN_DECIMALS));
    await baseToken.connect(deployer).mint(delegatedRenter.address, convertToWei('100', BASE_TOKEN_DECIMALS));

    ({ warperReference } = await setupForRenting());

    rentingEstimationParams = {
      warper: warperReference,
      renter: renterAccountId,
      paymentToken: baseTokenReference,
      listingId: COMMON_ID,
      rentalPeriod,
      listingTermsId: COMMON_ID,
    };

    warpedAsset = createAsset('erc721', toAccountId(warperReference.assetName.reference), 1);
    estimate = await rentingManagerAdapterRenter.estimateRent(rentingEstimationParams);
    addressTranslator = new AddressTranslator(getChainId());
    rentingParams = RentingHelper.prepareRentingParams(rentingEstimationParams, addressTranslator);
  });

  describe('delegatedRent', () => {
    beforeEach(async () => {
      await delegateRentAsset();
    });

    it('should rent asset on behalf of actual renter', async () => {
      const count = await rentingManager.userRentalCount(renter.address);
      const agreement = await rentingManager.rentalAgreementInfo(COMMON_ID);
      const asset = AssetCoder.decode(agreement.warpedAssets[0], getChainId());

      expect(count).to.eq(1);
      expect(agreement.renter).to.eq(renter.address);
      expect(agreement.listingId).to.eql(COMMON_ID);
      expect(agreement.universeId).to.eql(COMMON_ID);
      expect(asset).to.deep.equal(warpedAsset);
    });
  });

  describe('createDelegatedRentSignature', () => {
    let premadeSignature1: DelegatedSignatureWithNonce;
    let premadeSignature2: DelegatedSignatureWithNonce;

    beforeEach(async () => {
      premadeSignature1 = {
        nonce: BigNumber.from(0),
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildDelegatedRentDataV1(BigNumber.from(0)),
          buildDelegatedRentPrimaryTypeV1(),
          renter,
          getChainId().reference,
          rentingWizard.address,
        ),
      };

      premadeSignature2 = {
        nonce: BigNumber.from(1),
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildDelegatedRentDataV1(BigNumber.from(1)),
          buildDelegatedRentPrimaryTypeV1(),
          renter,
          getChainId().reference,
          rentingWizard.address,
        ),
      };
    });

    it('should create a signature', async () => {
      const signature1 = await rentingWizardAdapterRenter.createDelegatedRentSignature();
      const signature2 = await rentingWizardAdapterRenter.createDelegatedRentSignature(premadeSignature2.nonce);

      expect(signature1).to.deep.eq(premadeSignature1);
      expect(signature2).to.deep.eq(premadeSignature2);
    });
  });

  describe('verifyDelegatedRentSignature', () => {
    describe('if nonce has not changed', () => {
      it('should return true', async () => {
        const signature = await rentingWizardAdapterRenter.createDelegatedRentSignature();
        expect(
          await rentingWizardAdapterRenter.verifyDelegatedRentSignature(
            renterAccountId,
            signature.delegatedSignature.signature,
          ),
        ).to.eq(true);
      });
    });

    describe('if nonce has changed', () => {
      it('should return false', async () => {
        const signature = await rentingWizardAdapterRenter.createDelegatedRentSignature();
        expect(
          await rentingWizardAdapterRenter.verifyDelegatedRentSignature(
            renterAccountId,
            signature.delegatedSignature.signature,
            BigNumber.from(28),
          ),
        ).to.eq(false);
      });
    });
  });

  describe('createExtendedDelegatedRentSignature', () => {
    let firstSignature: DelegatedSignature;
    let secondSignature: DelegatedSignatureWithNonce;
    const nonce = BigNumber.from(0);

    beforeEach(async () => {
      firstSignature = await prepareTypedDataActionEip712SignatureV1(
        buildDelegatedRentDataV1(BigNumber.from(0)),
        buildDelegatedRentPrimaryTypeV1(),
        renter,
        getChainId().reference,
        rentingWizard.address,
      );
      secondSignature = {
        nonce,
        delegatedSignature: await prepareTypedDataActionEip712SignatureV1(
          buildExtendedDelegatedRentDataV1(
            salt,
            nonce,
            rentingParams,
            EMPTY_BYTES_DATA_HEX,
            EMPTY_BYTES_DATA_HEX,
            estimate.total,
            firstSignature.signatureEncodedForProtocol,
          ),
          buildExtendedDelegatedRentPrimaryTypeV1(),
          renter,
          getChainId().reference,
          rentingWizard.address,
        ),
      };
    });

    it('should create a signature', async () => {
      const signatureWithoutNonce = await rentingWizardAdapterRenter.createExtendedDelegatedRentSignature({
        params: {
          ...rentingEstimationParams,
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
          maxPaymentAmount: estimate.total,
        },
        salt,
      });
      const signatureWithNonce = await rentingWizardAdapterRenter.createExtendedDelegatedRentSignature(
        {
          params: {
            ...rentingEstimationParams,
            tokenQuote: EMPTY_BYTES_DATA_HEX,
            tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
            maxPaymentAmount: estimate.total,
          },
          salt,
        },
        { nonce, delegatedSignature: firstSignature },
      );

      expect(signatureWithoutNonce).to.deep.eq(signatureWithNonce);
      expect(signatureWithoutNonce).to.deep.eq(secondSignature.delegatedSignature);
    });
  });

  describe('verifyExtendedDelegatedRentSignature', () => {
    let signatureData: RentingExtendedDelegatedSignatureData;
    let signatureVerificationData: RentingExtendedDelegatedSignatureVerificationData;
    let signature: DelegatedSignatureWithNonce;
    let extendedSignature: DelegatedSignature;

    beforeEach(async () => {
      signatureData = {
        params: {
          ...rentingEstimationParams,
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
          maxPaymentAmount: estimate.total,
        },
        salt,
      };

      signature = await rentingWizardAdapterRenter.createDelegatedRentSignature();
      extendedSignature = await rentingWizardAdapterRenter.createExtendedDelegatedRentSignature(
        signatureData,
        signature,
      );

      signatureVerificationData = {
        ...signatureData,
        delegatedSignatureWithNonce: signature,
      };
    });

    describe('if data has not changed', () => {
      it('should return true', async () => {
        expect(
          await rentingWizardAdapterRenter.verifyExtendedDelegatedRentSignature(
            renterAccountId,
            signatureVerificationData,
            extendedSignature.signature,
          ),
        ).to.eq(true);
      });
    });

    describe('if data has changed', () => {
      it('should return false', async () => {
        expect(
          await rentingWizardAdapterRenter.verifyExtendedDelegatedRentSignature(
            renterAccountId,
            {
              ...signatureVerificationData,
              params: { ...signatureVerificationData.params, maxPaymentAmount: BigNumber.from(999) },
            },
            extendedSignature.signature,
          ),
        ).to.eq(false);
      });
    });
  });
});
