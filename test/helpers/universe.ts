import { ERC20Mock } from '../../src/contracts';
import { IUniverseRegistry } from '../../src/contracts/contracts/universe/universe-registry';
import { ethers } from 'hardhat';

export const makeUniverseParams = (name: string, paymentTokens: string[]): IUniverseRegistry.UniverseParamsStruct => ({
  name,
  paymentTokens,
});

export const createUniverse = async (baseToken: ERC20Mock): Promise<void> => {
  const universeRegistry = (await ethers.getContract('UniverseRegistry')) as IUniverseRegistry;
  const universeParams = makeUniverseParams('Test Universe', [baseToken.address]);
  await universeRegistry.createUniverse(universeParams);
};
