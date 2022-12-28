import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, AssetType, ChainId } from 'caip';
import { deployments, ethers } from 'hardhat';
import { ERC20Mock, ERC20Mock__factory, IMetahub, IWarperPresetFactory } from '../src/contracts';
import { BaseToken, MetahubAdapter, Multiverse } from '../src';
import { BASE_TOKEN } from './helpers/setup';
import { getChainId, toAccountId } from './helpers/utils';
import { createAssetReference } from './helpers/asset';

/**
 * @group integration
 */
describe('MetahubAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let warperPresetFactory: IWarperPresetFactory;

  /** SDK */
  let multiverse: Multiverse;
  let metahubAdapter: MetahubAdapter;

  /** Mocks & Samples */
  let baseToken: ERC20Mock;

  /** Data Structs */
  //...

  beforeAll(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    metahub = await ethers.getContract('Metahub');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    baseToken = new ERC20Mock__factory().attach(BASE_TOKEN).connect(deployer);

    multiverse = await Multiverse.init({ signer: deployer });
    metahubAdapter = multiverse.metahub(toAccountId(metahub.address));
  });

  describe('getChainId', () => {
    it('returns correct chain ID', async () => {
      await expect(metahubAdapter.getChainId()).resolves.toEqual(getChainId());
    });
  });

  describe('baseToken', () => {
    let baseTokenInfoRaw: BaseToken;

    beforeEach(async () => {
      baseTokenInfoRaw = {
        type: createAssetReference('erc20', baseToken.address),
        name: await baseToken.name(),
        symbol: await baseToken.symbol(),
        decimals: await baseToken.decimals(),
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
});
