import {
  BASE_TOKEN_DECIMALS,
  buildDelegatedRentDataV1,
  buildDelegatedRentPrimaryTypeV1,
  convertToWei,
  prepareTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol';
import {
  ERC20Mock,
  ERC721Mock,
  IMetahub,
  IRentingManager,
  IRentingWizardV1,
} from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType } from 'caip';
import { expect } from 'chai';
import { BytesLike } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AddressTranslator,
  Asset,
  AssetCoder,
  createAsset,
  IQSpace,
  RentingEstimationParams,
  RentingManagerAdapter,
  RentingWizardAdapterV1,
} from '../src';
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
  let rentingWizardAdapterDelegated: RentingWizardAdapterV1;

  /** Mocks & Samples */
  let baseToken: ERC20Mock;
  let collection: ERC721Mock;

  /** Constants */
  const rentalPeriod = SECONDS_IN_HOUR * 3;

  /** Data Structs */
  let warperReference: AssetType;
  let baseTokenReference: AssetType;
  let renterAccountId: AccountId;
  let rentingEstimationParams: RentingEstimationParams;
  let warpedAsset: Asset;

  const getDelegatedRentingSignature = async (): Promise<BytesLike> => {
    const delegatedRentingCurrentNonce = await rentingWizardAdapterDelegated.getDelegatedRentCurrentNonce(
      toAccountId(renter.address),
    );

    const data = await prepareTypedDataActionEip712SignatureV1(
      buildDelegatedRentDataV1(delegatedRentingCurrentNonce),
      buildDelegatedRentPrimaryTypeV1(),
      renter,
      getChainId().reference,
      rentingWizard.address,
    );

    return data.signatureEncodedForProtocol;
  };

  const delegateRentAsset = async (): Promise<void> => {
    const estimate = await rentingManagerAdapterRenter.estimateRent(rentingEstimationParams);
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
      await getDelegatedRentingSignature(),
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
    collection = await ethers.getContract('ERC721Mock');

    const renterIQSpace = await IQSpace.init({ signer: renter });
    const delegatedIQSpace = await IQSpace.init({ signer: delegatedRenter });
    rentingManagerAdapterRenter = renterIQSpace.rentingManager(toAccountId(rentingManager.address));
    rentingWizardAdapterDelegated = delegatedIQSpace.rentingWizardV1(toAccountId(rentingWizard.address));

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
});
