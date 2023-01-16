import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AddressTranslator,
  IQSpace,
  TaxTerms,
  TAX_STRATEGIES,
  WarperPresetInitData,
  WarperRegistrationParams,
  WarperWizardAdapterV1,
  WARPER_PRESETS_ERC721,
} from '../src';
import { ERC721Mock, IMetahub, IWarperManager, IWarperWizardV1 } from '../src/contracts';
import { setupUniverse, setupUniverseAndWarper } from './helpers/setup';
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
  let warperTaxTerms: TaxTerms;
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
    warperWizard = await ethers.getContract('WarperWizardV1');
    metahub = await ethers.getContract('Metahub');
    collection = await ethers.getContract('ERC721Mock');

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
      original: AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
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
