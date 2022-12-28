import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, ContractTransaction } from 'ethers';
import { deployments, ethers, getChainId } from 'hardhat';
import {
  Multiverse,
  UniverseParams,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  WarperPresetFactoryAdapter,
} from '../src';
import {
  ERC20Mock,
  ERC20Mock__factory,
  ERC721Mock,
  ERC721Mock__factory,
  IMetahub,
  IUniverseRegistry,
  IUniverseWizardV1,
  IWarperPresetFactory,
  UniverseWizardV1__factory,
} from '../src/contracts';
import { createAssetReference, mintAndApproveNFTs } from './helpers/asset';
import { BASE_TOKEN, COLLECTION, UNIVERSE_WIZARD } from './helpers/setup';
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
  let universeRegistry: IUniverseRegistry;
  let universeWizard: IUniverseWizardV1;
  let warperPresetFactory: IWarperPresetFactory;
  let metahub: IMetahub;
  let baseToken: ERC20Mock;
  let collection: ERC721Mock;

  /** SDK */
  let multiverse: Multiverse;
  let universeRegistryAdapter: UniverseRegistryAdapter;
  let universeWizardAdapter: UniverseWizardAdapterV1;
  let warperPresetFactoryAdapter: WarperPresetFactoryAdapter;

  /** Data Structs */
  let universeParams: UniverseParams;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    universeRegistry = await ethers.getContract('UniverseRegistry');
    universeWizard = new UniverseWizardV1__factory().attach(UNIVERSE_WIZARD).connect(deployer);
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    metahub = await ethers.getContract('Metahub');
    baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);
    collection = new ERC721Mock__factory().attach(COLLECTION);

    universeParams = { name: 'Test Universe', paymentTokens: [toAccountId(baseToken.address)] };

    multiverse = await Multiverse.init({ signer: deployer });
    universeRegistryAdapter = multiverse.universeRegistry(toAccountId(universeRegistry.address));
    universeWizardAdapter = multiverse.universeWizardV1(toAccountId(universeWizard.address));
    warperPresetFactoryAdapter = multiverse.warperPresetFactory(toAccountId(warperPresetFactory.address));
  });

  describe('setupUniverse', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      tx = await universeWizardAdapter.setupUniverse(universeParams);
    });

    it('should create universe', async () => {
      const universeInfo = await universeRegistryAdapter.findUniverseByCreationTransaction(tx.hash);
      expect(universeInfo).toMatchObject({ id: BigNumber.from(COMMON_ID), ...universeParams });
    });
  });

  describe('setupUniverseAndWarper', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      await mintAndApproveNFTs(collection, deployer);
      tx = await universeWizardAdapter.setupUniverseAndWarper(
        universeParams,
        createAssetReference('erc721', ethers.constants.AddressZero),
        makeTaxTermsFixedRate('1'),
        {
          name: 'Warper',
          universeId: BigNumber.from(0),
          paused: false,
        },
        WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
        getERC721ConfigurablePresetInitData(metahub.address, collection.address),
      );
    });

    it('should create universe', async () => {
      const universeInfo = await universeRegistryAdapter.findUniverseByCreationTransaction(tx.hash);
      const warperReference = await warperPresetFactoryAdapter.findWarperByDeploymentTransaction(tx.hash);
      expect(universeInfo).toMatchObject({ id: BigNumber.from(COMMON_ID), ...universeParams });
      expect(warperReference).toMatchObject({ chainId: getChainId(), assetName: { namespace: 'erc721' } });
    });
  });
});
