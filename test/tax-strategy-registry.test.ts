import { solidityIdBytes4, TAX_STRATEGY_IDS } from '@iqprotocol/iq-space-protocol';
import { IFixedRateTaxController, ITaxStrategyRegistry } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { IQSpace, TaxStrategyRegistryAdapter } from '../src';
import { toAccountId } from './helpers/utils';

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
      expect(await taxStrategyRegistryAdapter.taxController(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).to.be.deep.equal(
        toAccountId(taxController.address),
      );
    });
  });

  describe('taxStrategy', () => {
    it('should return tax strategy configuration', async () => {
      expect(await taxStrategyRegistryAdapter.taxStrategy(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).to.be.deep.equal({
        controller: toAccountId(taxController.address),
      });
    });
  });

  describe('isRegisteredListingStrategy', () => {
    describe('when strategy is not registered', () => {
      it('should return false', async () => {
        expect(await taxStrategyRegistryAdapter.isRegisteredTaxStrategy(solidityIdBytes4('gibberish'))).to.be.eq(false);
      });
    });

    describe('when strategy is registered', () => {
      it('should return true', async () => {
        expect(await taxStrategyRegistryAdapter.isRegisteredTaxStrategy(TAX_STRATEGY_IDS.FIXED_RATE_TAX)).to.be.eq(
          true,
        );
      });
    });
  });
});
