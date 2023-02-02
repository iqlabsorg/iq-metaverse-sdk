import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { IQSpace, TaxStrategyRegistryAdapter, TAX_STRATEGY_IDS } from '../src';
import { IFixedRateTaxController, ITaxStrategyRegistry } from '../src/contracts';
import { solidityIdBytes4, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('TaxStrategyRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let taxStrategyRegistry: ITaxStrategyRegistry;
  let taxController: IFixedRateTaxController;

  /** SDK */
  let taxStrategyRegistryAdapter: TaxStrategyRegistryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    taxStrategyRegistry = await ethers.getContract('TaxStrategyRegistry');
    taxController = await ethers.getContract('FixedRateTaxController');

    const iqSpace = await IQSpace.init({ signer: deployer });
    taxStrategyRegistryAdapter = iqSpace.taxStrategyRegistry(toAccountId(taxStrategyRegistry.address));
  });

  describe('taxController', () => {
    it('should return tax strategy controller', async () => {
      expect(await taxStrategyRegistryAdapter.taxController(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).toMatchObject(
        toAccountId(taxController.address),
      );
    });
  });

  describe('taxStrategy', () => {
    it('should return tax strategy configuration', async () => {
      expect(await taxStrategyRegistryAdapter.taxStrategy(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).toMatchObject({
        controller: toAccountId(taxController.address),
      });
    });
  });

  describe('isRegisteredListingStrategy', () => {
    describe('when strategy is not registered', () => {
      it('should return false', async () => {
        expect(await taxStrategyRegistryAdapter.isRegisteredTaxStrategy(solidityIdBytes4('gibberish'))).toBe(false);
      });
    });

    describe('when strategy is registered', () => {
      it('should return true', async () => {
        expect(await taxStrategyRegistryAdapter.isRegisteredTaxStrategy(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).toBe(true);
      });
    });
  });
});
