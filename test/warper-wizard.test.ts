import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { BytesLike } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { Multiverse, WarperWizardAdapterV1 } from '../src';
import {
  ERC721Mock,
  ERC721Mock__factory,
  IMetahub,
  IWarperManager,
  IWarperWizardV1,
  WarperWizardV1__factory,
} from '../src/contracts';
import { ITaxTermsRegistry } from '../src/contracts/contracts/tax/tax-terms-registry/ITaxTermsRegistry';
import { COLLECTION, setupUniverseAndWarper, WARPER_WIZARD } from './helpers/setup';
import { makeTaxTermsFixedRate } from './helpers/tax';
import { COMMON_ID, toAccountId } from './helpers/utils';
import { getERC721ConfigurablePresetInitData } from './helpers/warper';

/**
 * @group integration
 */
describe('UniverseWizardAdapterV1', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let warperManager: IWarperManager;
  let warperWizard: IWarperWizardV1;
  let metahub: IMetahub;
  let collection: ERC721Mock;

  /** SDK */
  let multiverse: Multiverse;
  let warperWizardAdapter: WarperWizardAdapterV1;

  /** Data Structs */
  let warperReference: AssetType;
  let warperParams: IWarperManager.WarperRegistrationParamsStruct;
  let warperTaxTerms: ITaxTermsRegistry.TaxTermsStruct;
  let warperInitData: BytesLike;

  const registerWarper = async (): Promise<void> => {
    await warperWizardAdapter.registerWarper(
      warperReference,
      warperTaxTerms,
      warperParams,
      WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
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

    multiverse = await Multiverse.init({ signer: deployer });
    warperWizardAdapter = multiverse.warperWizardV1(toAccountId(warperWizard.address));

    const { warperData } = await setupUniverseAndWarper();
    warperReference = warperData.warperReference;
    warperParams = {
      name: 'Test warper',
      universeId: COMMON_ID,
      paused: false,
    };
    warperTaxTerms = makeTaxTermsFixedRate('1');
    warperInitData = getERC721ConfigurablePresetInitData(metahub.address, collection.address);
  });

  describe('registerWarper', () => {
    beforeEach(async () => {
      await registerWarper();
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
});
