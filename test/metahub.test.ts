import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId, ChainId } from 'caip';
import { deployments, ethers } from 'hardhat';
import { MetahubAdapter, Multiverse } from '../src';
import { getChainId } from './helpers/utils';

/**
 * @group integration
 */
describe('MetahubAdapter', () => {
  let chainId: ChainId;
  let deployer: SignerWithAddress;
  let multiverse: Multiverse;
  let metahub: MetahubAdapter;

  beforeAll(async () => {
    await deployments.fixture();
    deployer = await ethers.getNamedSigner('deployer');

    chainId = getChainId();

    multiverse = await Multiverse.init({ signer: deployer });

    const metahubContract = await ethers.getContract('Metahub');
    metahub = multiverse.metahub(new AccountId({ chainId, address: metahubContract.address }));
  });

  describe('getChainId', () => {
    it('returns correct chain ID', async () => {
      await expect(metahub.getChainId()).resolves.toEqual(chainId);
    });
  });

  describe('baseToken', () => {
    it('returns base token', async () => {
      const baseToken = await metahub.baseToken();

      expect(baseToken.type).toBeDefined();
      expect(baseToken.name).toBeDefined();
      expect(baseToken.symbol).toBeDefined();
      expect(baseToken.decimals).toBeDefined();
      expect(baseToken.type.chainId).toEqual(chainId);
    });
  });
});
