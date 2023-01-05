import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { convertToWei } from '../src/utils';
import { BaseToken, MetahubAdapter, IQSpace, RentingEstimationParams, RentingManagerAdapter } from '../src';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721Mock,
  ERC721Mock__factory,
  IMetahub,
  IRentingManager,
  IWarperPresetFactory,
} from '../src/contracts';
import { createAssetReference } from './helpers/asset';
import { getSelectedConfiguratorListingTerms, getTokenQuoteData } from './helpers/listing-renting';
import { BASE_TOKEN, COLLECTION, setupForRenting, setupUniverseAndRegisteredWarper } from './helpers/setup';
import { COMMON_ID, getChainId, SECONDS_IN_HOUR, toAccountId, waitBlockchainTime } from './helpers/utils';

/**
 * @group integration
 */
describe('MetahubAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;
  let stranger: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let warperPresetFactory: IWarperPresetFactory;
  let rentingManager: IRentingManager;

  /** SDK */
  let metahubAdapter: MetahubAdapter;
  let metahubAdapterLister: MetahubAdapter;
  let rentingManagerAdapter: RentingManagerAdapter;

  /** Mocks & Samples */
  let baseToken: ERC20Mock;
  let collection: ERC721Mock;

  /** Constants */
  const rentalPeriod = SECONDS_IN_HOUR * 3;

  /** Data Structs */
  let listerAccountId: AccountId;
  let collectionReference: AssetType;
  let baseTokenReference: AssetType;
  let warperReference: AssetType;
  let renterAccountId: AccountId;
  let strangerAccountId: AccountId;
  let rentingEstimationParams: RentingEstimationParams;

  const rentAsset = async (): Promise<void> => {
    rentingEstimationParams = {
      warper: warperReference,
      renter: renterAccountId,
      paymentToken: baseTokenReference,
      listingId: COMMON_ID,
      rentalPeriod,
      listingTermsId: COMMON_ID,
      selectedConfiguratorListingTerms: getSelectedConfiguratorListingTerms(),
    };
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

  const rentAndWait = async (): Promise<void> => {
    await rentAsset();
    await waitBlockchainTime(rentalPeriod);
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');
    [renter, stranger] = await ethers.getUnnamedSigners();

    metahub = await ethers.getContract('Metahub');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    rentingManager = await ethers.getContract('RentingManager');
    baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);
    collection = new ERC721Mock__factory().attach(COLLECTION);

    const iqspace = await IQSpace.init({ signer: deployer });
    metahubAdapter = iqspace.metahub(toAccountId(metahub.address));

    const listeriqspace = await IQSpace.init({ signer: lister });
    metahubAdapterLister = listeriqspace.metahub(toAccountId(metahub.address));

    const renteriqspace = await IQSpace.init({ signer: renter });
    rentingManagerAdapter = renteriqspace.rentingManager(toAccountId(rentingManager.address));

    listerAccountId = toAccountId(lister.address);
    renterAccountId = toAccountId(renter.address);
    strangerAccountId = toAccountId(stranger.address);
    collectionReference = createAssetReference('erc721', collection.address);
    baseTokenReference = createAssetReference('erc20', baseToken.address);

    await baseToken.connect(deployer).mint(renter.address, convertToWei('1000'));
  });

  describe('getChainId', () => {
    it('returns correct chain ID', async () => {
      await expect(metahubAdapter.getChainId()).resolves.toEqual(getChainId());
    });
  });

  describe('baseToken', () => {
    let baseTokenInfoRaw: BaseToken;

    beforeEach(async () => {
      const base = baseToken.connect(deployer);
      baseTokenInfoRaw = {
        type: createAssetReference('erc20', baseToken.address),
        name: await base.name(),
        symbol: await base.symbol(),
        decimals: await base.decimals(),
      };
    });

    it('returns base token', async () => {
      const baseTokenInfo = await metahubAdapter.baseToken();
      expect(baseTokenInfo).toMatchObject(baseTokenInfoRaw);
    });
  });

  describe('warperPresetFactory', () => {
    it('should return address of the warper preset factory contract', async () => {
      const factory = await metahubAdapter.warperPresetFactory();
      expect(factory.address).toBe(warperPresetFactory.address);
    });
  });

  describe('supportedAssetCount', () => {
    describe('when there are no supported assets', () => {
      it('should return 0', async () => {
        const count = await metahubAdapter.supportedAssetCount();
        expect(count.toBigInt()).toBe(0n);
      });
    });

    describe('when there are supported assets', () => {
      beforeEach(async () => {
        await setupUniverseAndRegisteredWarper();
      });

      it('should return the number of supported assets', async () => {
        const count = await metahubAdapter.supportedAssetCount();
        expect(count.toBigInt()).toBe(1n);
      });
    });
  });

  describe('supportedAssets', () => {
    describe('when there are no supported assets', () => {
      it('should return an empty array', async () => {
        const assets = await metahubAdapter.supportedAssets(0, 10);
        expect(assets.length).toBe(0);
      });
    });

    describe('when there are supported assets', () => {
      beforeEach(async () => {
        await setupUniverseAndRegisteredWarper();
      });

      it('should return the list of supported assets', async () => {
        const assets = await metahubAdapter.supportedAssets(0, 10);
        expect(assets[0]).toMatchObject(collectionReference);
      });
    });
  });

  describe('when listing has been setup', () => {
    beforeEach(async () => {
      ({ warperReference } = await setupForRenting());
    });

    describe('balance', () => {
      describe('when user has not accumulated anything', () => {
        it('should return 0', async () => {
          const balance = await metahubAdapter.balance(listerAccountId, baseTokenReference);
          expect(balance.toBigInt()).toBe(0n);
        });
      });

      describe('when user has accumulated some tokens', () => {
        beforeEach(async () => {
          await rentAndWait();
        });

        it('should return accumulated value', async () => {
          const balance = await metahubAdapter.balance(listerAccountId, baseTokenReference);
          expect(balance.toBigInt()).toBeGreaterThan(0n);
        });
      });
    });

    describe('balances', () => {
      describe('when user has not accumulated anything', () => {
        it('should return an empty array', async () => {
          const balances = await metahubAdapter.balances(listerAccountId);
          expect(balances.length).toBe(0);
        });
      });

      describe('when user has accumulated some tokens', () => {
        beforeEach(async () => {
          await rentAndWait();
        });

        it('should return accumulated value', async () => {
          const balances = await metahubAdapter.balances(listerAccountId);
          const balance = balances[0];
          expect(balance.amount.toBigInt()).toBeGreaterThan(0n);
          expect(balance.token).toMatchObject(baseTokenReference);
        });
      });
    });

    describe('universeBalance', () => {
      describe('when universe has not accumulated anything', () => {
        it('should return 0', async () => {
          const balance = await metahubAdapter.universeBalance(COMMON_ID, baseTokenReference);
          expect(balance.toBigInt()).toBe(0n);
        });
      });

      describe('when universe has accumulated some tokens', () => {
        beforeEach(async () => {
          await rentAndWait();
        });

        it('should return accumulated value', async () => {
          const balance = await metahubAdapter.universeBalance(COMMON_ID, baseTokenReference);
          expect(balance.toBigInt()).toBeGreaterThan(0n);
        });
      });
    });

    describe('universeBalances', () => {
      describe('when universe has not accumulated anything', () => {
        it('should return an empty array', async () => {
          const balances = await metahubAdapter.universeBalances(COMMON_ID);
          expect(balances.length).toBe(0);
        });
      });

      describe('when universe has accumulated some tokens', () => {
        beforeEach(async () => {
          await rentAndWait();
        });

        it('should return accumulated value', async () => {
          const balances = await metahubAdapter.universeBalances(COMMON_ID);
          const balance = balances[0];
          expect(balance.amount.toBigInt()).toBeGreaterThan(0n);
          expect(balance.token).toMatchObject(baseTokenReference);
        });
      });
    });

    describe('withdrawFunds', () => {
      let amount: BigNumber;

      beforeEach(async () => {
        await rentAndWait();
        amount = await metahub.balance(lister.address, baseToken.address);
      });

      it('should withdraw user funds', async () => {
        await metahubAdapterLister.withdrawFunds(baseTokenReference, amount, strangerAccountId);
        const strangersBalance = await baseToken.connect(stranger).balanceOf(stranger.address);
        expect(strangersBalance.toBigInt()).toBe(amount.toBigInt());
      });
    });

    describe('withdrawUniverseFunds', () => {
      let amount: BigNumber;

      beforeEach(async () => {
        await rentAndWait();
        amount = await metahub.universeBalance(COMMON_ID, baseToken.address);
      });

      it('should withdraw user funds', async () => {
        await metahubAdapter.withdrawUniverseFunds(COMMON_ID, baseTokenReference, amount, strangerAccountId);
        const strangersBalance = await baseToken.connect(stranger).balanceOf(stranger.address);
        expect(strangersBalance.toBigInt()).toBe(amount.toBigInt());
      });
    });
  });
});
