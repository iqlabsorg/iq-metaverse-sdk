import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { AssetType, IQSpace, TaxTermsRegistryAdapter, TAX_STRATEGY_IDS } from '../src';
import { ITaxTermsRegistry } from '../src/contracts';
import { createWarper, setupForListing, setupUniverse, setupUniverseAndWarper } from './helpers/setup';
import { makeTaxTermsFixedRate, makeTaxTermsFixedRateWithReward } from './helpers/tax';
import { COMMON_ID, COMMON_REWARD_RATE, COMMON_TAX_RATE, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('TaxTermsRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let taxTermsRegistry: ITaxTermsRegistry;

  /** SDK */
  let iqspace: IQSpace;
  let taxTermsRegistryAdapter: TaxTermsRegistryAdapter;

  /** Data Structs */
  let warperReference: AssetType;

  /** Constants */
  const taxTermsFixedRate: ITaxTermsRegistry.TaxTermsStruct = makeTaxTermsFixedRate(COMMON_TAX_RATE);
  const taxTermsFixedRateWithReward = makeTaxTermsFixedRateWithReward(COMMON_TAX_RATE, COMMON_REWARD_RATE);

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    taxTermsRegistry = await ethers.getContract('TaxTermsRegistry');

    iqspace = await IQSpace.init({ signer: deployer });
    taxTermsRegistryAdapter = iqspace.taxTermsRegistry(toAccountId(taxTermsRegistry.address));
  });

  describe('registerUniverseLocalTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
    });

    it('should register universe local tax terms', async () => {
      await taxTermsRegistryAdapter.registerUniverseLocalTaxTerms(COMMON_ID, taxTermsFixedRate);
      const registered = await taxTermsRegistry.areRegisteredUniverseLocalTaxTerms(
        COMMON_ID,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(true);
    });
  });

  describe('removeUniverseLocalTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
      await taxTermsRegistry.connect(deployer).registerUniverseLocalTaxTerms(COMMON_ID, taxTermsFixedRate);
    });

    it('should remove universe local tax terms', async () => {
      await taxTermsRegistryAdapter.removeUniverseLocalTaxTerms(COMMON_ID, TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      const registered = await taxTermsRegistry.areRegisteredUniverseLocalTaxTerms(
        COMMON_ID,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(false);
    });
  });

  describe('registerUniverseWarperTaxTerms', () => {
    beforeEach(async () => {
      const { warperData } = await setupUniverseAndWarper();
      warperReference = warperData.warperReference;
    });

    it('should register universe warper tax terms', async () => {
      await taxTermsRegistryAdapter.registerUniverseWarperTaxTerms(COMMON_ID, warperReference, taxTermsFixedRate);
      const registered = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
        COMMON_ID,
        warperReference.assetName.reference,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(true);
    });
  });

  describe('removeUniverseWarperTaxTerms', () => {
    beforeEach(async () => {
      const { warperData } = await setupUniverseAndWarper();
      warperReference = warperData.warperReference;
      await taxTermsRegistry
        .connect(deployer)
        .registerUniverseWarperTaxTerms(COMMON_ID, warperReference.assetName.reference, taxTermsFixedRate);
    });

    it('should remove universe warper tax terms', async () => {
      await taxTermsRegistryAdapter.removeUniverseWarperTaxTerms(
        COMMON_ID,
        warperReference,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      const registered = await taxTermsRegistry.areRegisteredUniverseWarperTaxTerms(
        COMMON_ID,
        warperReference.assetName.reference,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(false);
    });
  });

  describe('registerProtocolGlobalTaxTerms', () => {
    it('should register protocol global tax terms', async () => {
      await taxTermsRegistryAdapter.registerProtocolGlobalTaxTerms(taxTermsFixedRate);
      const registered = await taxTermsRegistry.areRegisteredProtocolGlobalTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      expect(registered).toBe(true);
    });
  });

  describe('removeProtocolGlobalTaxTerms', () => {
    beforeEach(async () => {
      await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(taxTermsFixedRate);
    });

    it('should remove protocol global tax terms', async () => {
      await taxTermsRegistryAdapter.removeProtocolGlobalTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      const registered = await taxTermsRegistry.areRegisteredProtocolGlobalTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      expect(registered).toBe(false);
    });
  });

  describe('registerProtocolUniverseTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
    });

    it('should register protocol universe tax terms', async () => {
      await taxTermsRegistryAdapter.registerProtocolUniverseTaxTerms(COMMON_ID, taxTermsFixedRate);
      const registered = await taxTermsRegistry.areRegisteredProtocolUniverseTaxTerms(
        COMMON_ID,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(true);
    });
  });

  describe('removeProtocolUniverseTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
      await taxTermsRegistry.connect(deployer).registerProtocolUniverseTaxTerms(COMMON_ID, taxTermsFixedRate);
    });

    it('should remove protocol universe tax terms', async () => {
      await taxTermsRegistryAdapter.removeProtocolUniverseTaxTerms(COMMON_ID, TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      const registered = await taxTermsRegistry.areRegisteredProtocolUniverseTaxTerms(
        COMMON_ID,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(false);
    });
  });

  describe('registerProtocolWarperTaxTerms', () => {
    beforeEach(async () => {
      ({ warperReference } = await createWarper());
    });

    it('should register protocol warper tax terms', async () => {
      await taxTermsRegistryAdapter.registerProtocolWarperTaxTerms(warperReference, taxTermsFixedRate);
      const registered = await taxTermsRegistry.areRegisteredProtocolWarperTaxTerms(
        warperReference.assetName.reference,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(true);
    });
  });

  describe('removeProtocolWarperTaxTerms', () => {
    beforeEach(async () => {
      ({ warperReference } = await createWarper());
      await taxTermsRegistry
        .connect(deployer)
        .registerProtocolWarperTaxTerms(warperReference.assetName.reference, taxTermsFixedRate);
    });

    it('should remove universe warper tax terms', async () => {
      await taxTermsRegistryAdapter.removeProtocolWarperTaxTerms(warperReference, TAX_STRATEGY_IDS.FIXED_RATE_TAX);
      const registered = await taxTermsRegistry.areRegisteredProtocolWarperTaxTerms(
        warperReference.assetName.reference,
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
      expect(registered).toBe(false);
    });
  });

  describe('areRegisteredUniverseWarperTaxTerms', () => {
    beforeEach(async () => {
      const { warperData } = await setupUniverseAndWarper();
      warperReference = warperData.warperReference;
    });

    describe('when tax terms are not registered', () => {
      it('should return false', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when fixed tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerUniverseWarperTaxTerms(COMMON_ID, warperReference.assetName.reference, taxTermsFixedRate);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });

    describe('when fixed with reward tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerUniverseWarperTaxTerms(COMMON_ID, warperReference.assetName.reference, taxTermsFixedRateWithReward);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('areRegisteredUniverseLocalTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
    });

    describe('when tax terms are not registered', () => {
      it('should return false', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseLocalTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when fixed tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry.connect(deployer).registerUniverseLocalTaxTerms(COMMON_ID, taxTermsFixedRate);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseLocalTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });

    describe('when fixed with reward tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry.connect(deployer).registerUniverseLocalTaxTerms(COMMON_ID, taxTermsFixedRateWithReward);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseLocalTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('areRegisteredProtocolGlobalTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
    });

    describe('when tax terms are not registered', () => {
      it('should return false', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolGlobalTaxTerms(
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when fixed tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(taxTermsFixedRate);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolGlobalTaxTerms(
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });

    describe('when fixed with reward tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(taxTermsFixedRateWithReward);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolGlobalTaxTerms(
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('areRegisteredProtocolUniverseTaxTerms', () => {
    beforeEach(async () => {
      await setupUniverse();
    });

    describe('when tax terms are not registered', () => {
      it('should return false', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolUniverseTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when fixed tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry.connect(deployer).registerProtocolUniverseTaxTerms(COMMON_ID, taxTermsFixedRate);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolUniverseTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });

    describe('when fixed with reward tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerProtocolUniverseTaxTerms(COMMON_ID, taxTermsFixedRateWithReward);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolUniverseTaxTerms(
          COMMON_ID,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('areRegisteredProtocolWarperTaxTerms', () => {
    beforeEach(async () => {
      const { warperData } = await setupUniverseAndWarper();
      warperReference = warperData.warperReference;
    });

    describe('when tax terms are not registered', () => {
      it('should return false', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolWarperTaxTerms(
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when fixed tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerProtocolWarperTaxTerms(warperReference.assetName.reference, taxTermsFixedRate);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolWarperTaxTerms(
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });

    describe('when fixed with reward tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerProtocolWarperTaxTerms(warperReference.assetName.reference, taxTermsFixedRateWithReward);
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredProtocolWarperTaxTerms(
          warperReference,
          TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('universeTaxTerms', () => {
    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
      });

      it('should return fixed rate universe tax terms', async () => {
        const terms = await taxTermsRegistryAdapter.universeTaxTerms({
          taxStrategyId: TAX_STRATEGY_IDS.FIXED_RATE_TAX,
          universeId: COMMON_ID,
          warper: warperReference,
        });

        expect(terms).toBeDefined();
        expect(terms).toMatchObject(taxTermsFixedRate);
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing(true));
      });

      it('should return fixed with reward universe tax terms ', async () => {
        const terms = await taxTermsRegistryAdapter.universeTaxTerms({
          taxStrategyId: TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
          universeId: COMMON_ID,
          warper: warperReference,
        });

        expect(terms).toBeDefined();
        expect(terms).toMatchObject(taxTermsFixedRateWithReward);
      });
    });
  });

  describe('protocolTaxTerms', () => {
    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing());
      });

      it('should return fixed rate protocol tax terms', async () => {
        const terms = await taxTermsRegistryAdapter.protocolTaxTerms({
          taxStrategyId: TAX_STRATEGY_IDS.FIXED_RATE_TAX,
          universeId: COMMON_ID,
          warper: warperReference,
        });

        expect(terms).toBeDefined();
        expect(terms).toMatchObject(taxTermsFixedRate);
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForListing(true));
      });

      it('should return fixed rate with reward protocol tax terms', async () => {
        const terms = await taxTermsRegistryAdapter.protocolTaxTerms({
          taxStrategyId: TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
          universeId: COMMON_ID,
          warper: warperReference,
        });

        expect(terms).toBeDefined();
        expect(terms).toMatchObject(taxTermsFixedRateWithReward);
      });
    });
  });
});
