import { IUniverseRegistry } from '../../src/contracts/contracts/universe/universe-registry';

export const makeUniverseParams = (name: string, paymentTokens: string[]): IUniverseRegistry.UniverseParamsStruct => ({
  name,
  paymentTokens,
});
