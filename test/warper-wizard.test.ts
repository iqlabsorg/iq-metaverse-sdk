import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AddressTranslator,
  IQSpace,
  TaxTerms,
  TAX_STRATEGIES,
  TAX_STRATEGY_IDS,
  WarperPresetInitData,
  WarperRegistrationParams,
  WarperWizardAdapterV1,
  WARPER_PRESETS_ERC721,
} from '../src';
import { ERC721Mock, IMetahub, ITaxTermsRegistry, IWarperManager, IWarperWizardV1 } from '../src/contracts';
import { setupUniverse, setupUniverseAndWarper } from './helpers/setup';
import { COMMON_ID, COMMON_RATE, COMMON_REWARD, toAccountId } from './helpers/utils';
import { findWarperByDeploymentTransaction } from './helpers/warper';

/**
 * @group integration
 */
describe('WarperWizardAdapterV1', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let warperManager: IWarperManager;
  let warperWizard: IWarperWizardV1;
  let taxTermsRegistry: ITaxTermsRegistry;
  let metahub: IMetahub;
  let collection: ERC721Mock;

  /** SDK */
  let iqspace: IQSpace;
  let warperWizardAdapter: WarperWizardAdapterV1;

  /** Data Structs */
  let warperReference: AssetType;
  let warperParams: WarperRegistrationParams;
  let warperTaxTerms: TaxTerms;
  let warperTaxTermsWithReward: TaxTerms;
  let warperInitData: WarperPresetInitData;

  const registerExistingWarper = async (taxTerms: TaxTerms): Promise<void> => {
    await warperWizardAdapter.registerExistingWarper(warperReference, taxTerms, warperParams);
  };

  const createWarperFromPresetAndRegister = async (taxTerms: TaxTerms): Promise<ContractTransaction> => {
    return await warperWizardAdapter.createWarperFromPresetAndRegister(
      taxTerms,
      warperParams,
      WARPER_PRESETS_ERC721.ERC721_CONFIGURABLE_PRESET,
      warperInitData,
    );
  };

  const setupUniverseAndWarperAndGetReference = async (): Promise<AssetType> => {
    const { warperData } = await setupUniverseAndWarper();
    return warperData.warperReference;
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    warperManager = await ethers.getContract('WarperManager');
    warperWizard = await ethers.getContract('WarperWizardV1');
    taxTermsRegistry = await ethers.getContract('TaxTermsRegistry');
    metahub = await ethers.getContract('Metahub');
    collection = await ethers.getContract('ERC721Mock');

    iqspace = await IQSpace.init({ signer: deployer });
    warperWizardAdapter = iqspace.warperWizardV1(toAccountId(warperWizard.address));

    warperParams = {
      name: 'Test warper',
      universeId: COMMON_ID,
      paused: false,
    };
    warperTaxTerms = { name: TAX_STRATEGIES.FIXED_RATE_TAX, data: { ratePercent: COMMON_RATE } };
    warperTaxTermsWithReward = {
      name: TAX_STRATEGIES.FIXED_RATE_TAX_WITH_REWARD,
      data: { ratePercent: COMMON_RATE, rewardRatePercent: COMMON_REWARD },
    };
    warperInitData = {
      metahub: toAccountId(metahub.address),
      original: AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
    };
  });

  describe('registerExistingWarper', () => {
    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        warperReference = await setupUniverseAndWarperAndGetReference();
        await registerExistingWarper(warperTaxTerms);
      });

      it('should register warper to universe with fixed rate tax', async () => {
        const count = await warperManager.universeWarperCount(COMMON_ID);
        const info = await warperManager.warperInfo(warperReference.assetName.reference);
        const isFixedRateTax = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference.assetName.reference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );

        expect(isFixedRateTax).toBe(true);
        expect(count.toBigInt()).toBe(1n);
        expect(info).toMatchObject(warperParams);
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        warperReference = await setupUniverseAndWarperAndGetReference();
        await registerExistingWarper(warperTaxTermsWithReward);
      });

      it('should register warper to universe with fixed rate and reward tax', async () => {
        const count = await warperManager.universeWarperCount(COMMON_ID);
        const info = await warperManager.warperInfo(warperReference.assetName.reference);
        const isFixedRateWithRewardTax = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference.assetName.reference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );

        expect(isFixedRateWithRewardTax).toBe(true);
        expect(count.toBigInt()).toBe(1n);
        expect(info).toMatchObject(warperParams);
      });
    });
  });

  describe('deregisterWarper', () => {
    beforeEach(async () => {
      warperReference = await setupUniverseAndWarperAndGetReference();
      await registerExistingWarper(warperTaxTerms);
      await warperWizardAdapter.deregisterWarper(warperReference);
    });

    it('should deregister warper from universe', async () => {
      const count = await warperManager.universeWarperCount(COMMON_ID);
      expect(count.toBigInt()).toBe(0n);
    });
  });

  describe('createWarperFromPresetAndRegister', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      await setupUniverse();
    });

    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        tx = await createWarperFromPresetAndRegister(warperTaxTerms);
      });

      it('should create and register a new warper with fixed rate tax', async () => {
        const warperAddress = await findWarperByDeploymentTransaction(tx.hash);
        const count = await warperManager.universeWarperCount(COMMON_ID);
        const info = await warperManager.warperInfo(warperAddress!);
        const isFixedRateTax = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperAddress!,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );

        expect(isFixedRateTax).toBe(true);
        expect(count.toBigInt()).toBe(1n);
        expect(info).toMatchObject(warperParams);
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        tx = await createWarperFromPresetAndRegister(warperTaxTermsWithReward);
      });

      it('should create and register a new warper with fixed rate and reward tax', async () => {
        const warperAddress = await findWarperByDeploymentTransaction(tx.hash);
        const count = await warperManager.universeWarperCount(COMMON_ID);
        const info = await warperManager.warperInfo(warperAddress!);
        const isFixedRateWithRewardTax = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperAddress!,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );

        expect(isFixedRateWithRewardTax).toBe(true);
        expect(count.toBigInt()).toBe(1n);
        expect(info).toMatchObject(warperParams);
      });
    });
  });
});
