import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import {
  AddressTranslator,
  IQSpace,
  TaxTerms,
  TAX_STRATEGIES,
  UniverseParams,
  UniverseWizardAdapterV1,
  WarperPresetInitData,
  WARPER_PRESETS_ERC721,
} from '../src';
import {
  ERC20Mock,
  ERC721Mock,
  IMetahub,
  IUniverseRegistry,
  IUniverseWizardV1,
  IWarperManager,
} from '../src/contracts';
import { mintAndApproveNFTs } from './helpers/asset';
import { createWarper } from './helpers/setup';
import { COMMON_ID, COMMON_TAX_RATE, toAccountId } from './helpers/utils';
import { findWarperByDeploymentTransaction } from './helpers/warper';

/**
 * @group integration
 */
describe('UniverseWizardAdapterV1', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let warperManager: IWarperManager;
  let universeRegistry: IUniverseRegistry;
  let universeWizard: IUniverseWizardV1;
  let metahub: IMetahub;
  let baseToken: ERC20Mock;
  let collection: ERC721Mock;

  /** SDK */
  let iqspace: IQSpace;
  let universeWizardAdapter: UniverseWizardAdapterV1;

  /** Data Structs */
  let universeParams: UniverseParams;
  let warperParams: IWarperManager.WarperRegistrationParamsStruct;
  let warperTaxTerms: TaxTerms;
  let warperInitData: WarperPresetInitData;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    warperManager = await ethers.getContract('WarperManager');
    universeRegistry = await ethers.getContract('UniverseRegistry');
    universeWizard = await ethers.getContract('UniverseWizardV1');
    metahub = await ethers.getContract('Metahub');
    baseToken = await ethers.getContract('ERC20Mock');
    collection = await ethers.getContract('ERC721Mock');

    iqspace = await IQSpace.init({ signer: deployer });
    universeWizardAdapter = iqspace.universeWizardV1(toAccountId(universeWizard.address));

    universeParams = { name: 'Test Universe', paymentTokens: [toAccountId(baseToken.address)] };
    warperTaxTerms = { name: TAX_STRATEGIES.FIXED_RATE_TAX, data: { ratePercent: COMMON_TAX_RATE } };
    warperParams = {
      name: 'Warper',
      universeId: BigNumber.from(0),
      paused: false,
    };
    warperInitData = {
      metahub: toAccountId(metahub.address),
      original: AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
    };
  });

  describe('setupUniverse', () => {
    beforeEach(async () => {
      await universeWizardAdapter.setupUniverse(universeParams);
    });

    it('should create universe', async () => {
      const universeInfo = await universeRegistry.universe(COMMON_ID);
      expect(universeInfo).toMatchObject({
        name: universeParams.name,
        paymentTokens: universeParams.paymentTokens.map(x => x.address),
      });
    });
  });

  describe('setupUniverseAndCreateWarperFromPresetAndRegister', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      await mintAndApproveNFTs(collection, deployer);
      tx = await universeWizardAdapter.setupUniverseAndCreateWarperFromPresetAndRegister(
        universeParams,
        warperTaxTerms,
        warperParams,
        WARPER_PRESETS_ERC721.ERC721_CONFIGURABLE_PRESET,
        warperInitData,
      );
    });

    it('should create universe and warper', async () => {
      const universeInfo = await universeRegistry.universe(COMMON_ID);
      const warperAddress = await findWarperByDeploymentTransaction(tx.hash);
      const warperInfo = await warperManager.warperInfo(warperAddress!);
      expect(universeInfo).toMatchObject({
        name: universeParams.name,
        paymentTokens: universeParams.paymentTokens.map(x => x.address),
      });
      expect(warperInfo).toMatchObject({ ...warperParams, universeId: COMMON_ID });
    });
  });

  describe('setupUniverseAndRegisterExistingWarper', () => {
    let warperAddress: string;

    beforeEach(async () => {
      const { warperReference } = await createWarper();
      warperAddress = warperReference.assetName.reference;
      await universeWizardAdapter.setupUniverseAndRegisterExistingWarper(
        universeParams,
        warperReference,
        warperTaxTerms,
        warperParams,
      );
    });

    it('should create a universe and register the existing warper to it', async () => {
      const universeInfo = await universeRegistry.universe(COMMON_ID);
      const warperInfo = await warperManager.warperInfo(warperAddress!);
      expect(universeInfo).toMatchObject({
        name: universeParams.name,
        paymentTokens: universeParams.paymentTokens.map(x => x.address),
      });
      expect(warperInfo).toMatchObject({ universeId: COMMON_ID });
    });
  });
});
