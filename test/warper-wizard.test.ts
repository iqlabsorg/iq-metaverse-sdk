import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  IQSpace,
  TaxTermsParams,
  TAX_STRATEGIES,
  WarperPresetInitData,
  WarperRegistrationParams,
  WarperWizardAdapterV1,
  WARPER_PRESETS_ERC721,
} from '../src';
import {
  ERC721Mock,
  ERC721Mock__factory,
  IMetahub,
  IWarperManager,
  IWarperWizardV1,
  WarperWizardV1__factory,
} from '../src/contracts';
import { createAssetReference } from './helpers/asset';
import { COLLECTION, setupUniverse, setupUniverseAndWarper, WARPER_WIZARD } from './helpers/setup';
import { COMMON_ID, COMMON_TAX_RATE, toAccountId } from './helpers/utils';
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
  let metahub: IMetahub;
  let collection: ERC721Mock;

  /** SDK */
  let iqspace: IQSpace;
  let warperWizardAdapter: WarperWizardAdapterV1;

  /** Data Structs */
  let warperReference: AssetType;
  let warperParams: WarperRegistrationParams;
  let warperTaxTerms: TaxTermsParams;
  let warperInitData: WarperPresetInitData;

  const registerExistingWarper = async (): Promise<void> => {
    await warperWizardAdapter.registerExistingWarper(warperReference, warperTaxTerms, warperParams);
  };

  const createWarperFromPresetAndRegister = async (): Promise<ContractTransaction> => {
    return await warperWizardAdapter.createWarperFromPresetAndRegister(
      warperTaxTerms,
      warperParams,
      WARPER_PRESETS_ERC721.ERC721_CONFIGURABLE_PRESET,
      warperInitData,
    );
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    warperManager = await ethers.getContract('WarperManager');
    warperWizard = new WarperWizardV1__factory().attach(WARPER_WIZARD).connect(deployer);
    metahub = await ethers.getContract('Metahub');
    collection = new ERC721Mock__factory().attach(COLLECTION);

    iqspace = await IQSpace.init({ signer: deployer });
    warperWizardAdapter = iqspace.warperWizardV1(toAccountId(warperWizard.address));

    warperParams = {
      name: 'Test warper',
      universeId: COMMON_ID,
      paused: false,
    };
    warperTaxTerms = { name: TAX_STRATEGIES.FIXED_RATE_TAX, data: { ratePercent: COMMON_TAX_RATE } };
    warperInitData = {
      metahub: toAccountId(metahub.address),
      original: createAssetReference('erc721', collection.address),
    };
  });

  describe('registerExistingWarper', () => {
    beforeEach(async () => {
      const { warperData } = await setupUniverseAndWarper();
      warperReference = warperData.warperReference;
      await registerExistingWarper();
    });

    it('should register warper to universe', async () => {
      const count = await warperManager.universeWarperCount(COMMON_ID);
      const info = await warperManager.warperInfo(warperReference.assetName.reference);
      expect(count.toBigInt()).toBe(1n);
      expect(info).toMatchObject(warperParams);
    });

    describe('deregisterWarper', () => {
      beforeEach(async () => {
        await warperWizardAdapter.deregisterWarper(warperReference);
      });

      it('should deregister warper from universe', async () => {
        const count = await warperManager.universeWarperCount(COMMON_ID);
        expect(count.toBigInt()).toBe(0n);
      });
    });
  });

  describe('createWarperFromPresetAndRegister', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      await setupUniverse();
      tx = await createWarperFromPresetAndRegister();
    });

    it('should create and register a new warper', async () => {
      const warperAddress = await findWarperByDeploymentTransaction(tx.hash);
      const count = await warperManager.universeWarperCount(COMMON_ID);
      const info = await warperManager.warperInfo(warperAddress!);
      expect(count.toBigInt()).toBe(1n);
      expect(info).toMatchObject(warperParams);
    });
  });
});
