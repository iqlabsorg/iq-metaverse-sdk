import { TAX_STRATEGIES, WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BytesLike, ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { IQSpace, TaxTermsParams, UniverseParams, UniverseWizardAdapterV1 } from '../src';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721Mock,
  ERC721Mock__factory,
  IMetahub,
  IUniverseRegistry,
  IUniverseWizardV1,
  IWarperManager,
  UniverseWizardV1__factory,
} from '../src/contracts';
import { createAssetReference, mintAndApproveNFTs } from './helpers/asset';
import { BASE_TOKEN, COLLECTION, UNIVERSE_WIZARD } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';
import { findWarperByDeploymentTransaction, getERC721ConfigurablePresetInitData } from './helpers/warper';

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
  let warperTaxTerms: TaxTermsParams;
  let warperInitData: BytesLike;

  /** Constants */
  const zeroAddressReference = createAssetReference('erc721', ethers.constants.AddressZero);

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    warperManager = await ethers.getContract('WarperManager');
    universeRegistry = await ethers.getContract('UniverseRegistry');
    universeWizard = new UniverseWizardV1__factory().attach(UNIVERSE_WIZARD).connect(deployer);
    metahub = await ethers.getContract('Metahub');
    baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);
    collection = new ERC721Mock__factory().attach(COLLECTION);

    iqspace = await IQSpace.init({ signer: deployer });
    universeWizardAdapter = iqspace.universeWizardV1(toAccountId(universeWizard.address));

    universeParams = { name: 'Test Universe', paymentTokens: [toAccountId(baseToken.address)] };
    warperTaxTerms = { name: TAX_STRATEGIES.FIXED_RATE_TAX, data: { ratePercent: '1' } };
    warperParams = {
      name: 'Warper',
      universeId: BigNumber.from(0),
      paused: false,
    };
    warperInitData = getERC721ConfigurablePresetInitData(metahub.address, collection.address);
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

  describe('setupUniverseAndWarper', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      await mintAndApproveNFTs(collection, deployer);
      tx = await universeWizardAdapter.setupUniverseAndWarper(
        universeParams,
        zeroAddressReference,
        warperTaxTerms,
        warperParams,
        WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
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
});
