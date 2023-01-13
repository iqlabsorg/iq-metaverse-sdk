import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import { AssetType, IQSpace, TaxTermsRegistryAdapter, TAX_STRATEGIES } from '../src';
import { ITaxTermsRegistry } from '../src/contracts';
import { setupForListing, setupUniverseAndWarper } from './helpers/setup';
import { makeTaxTermsFixedRate } from './helpers/tax';
import { COMMON_ID, COMMON_TAX_RATE, toAccountId } from './helpers/utils';

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

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    taxTermsRegistry = await ethers.getContract('TaxTermsRegistry');

    iqspace = await IQSpace.init({ signer: deployer });
    taxTermsRegistryAdapter = iqspace.taxTermsRegistry(toAccountId(taxTermsRegistry.address));
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
          TAX_STRATEGIES.FIXED_RATE_TAX,
        );
        expect(registered).toBe(false);
      });
    });

    describe('when tax terms are registered', () => {
      beforeEach(async () => {
        await taxTermsRegistry
          .connect(deployer)
          .registerUniverseWarperTaxTerms(
            COMMON_ID,
            warperReference.assetName.reference,
            makeTaxTermsFixedRate(COMMON_TAX_RATE),
          );
      });

      it('should return true', async () => {
        const registered = await taxTermsRegistryAdapter.areRegisteredUniverseWarperTaxTerms(
          COMMON_ID,
          warperReference,
          TAX_STRATEGIES.FIXED_RATE_TAX,
        );
        expect(registered).toBe(true);
      });
    });
  });

  describe('universeTaxTerms', () => {
    beforeEach(async () => {
      ({ warperReference } = await setupForListing());
    });

    it('should return universe tax terms', async () => {
      const terms = await taxTermsRegistryAdapter.universeTaxTerms({
        taxStrategyIdName: TAX_STRATEGIES.FIXED_RATE_TAX,
        universeId: COMMON_ID,
        warper: warperReference,
      });

      expect(terms).toBeDefined();
      expect(terms.name).toBe(TAX_STRATEGIES.FIXED_RATE_TAX);
      expect(terms.data.ratePercent).toBe(COMMON_TAX_RATE);
    });
  });

  describe('protocolTaxTerms', () => {
    beforeEach(async () => {
      ({ warperReference } = await setupForListing());
    });

    it('should return protocol tax terms', async () => {
      const terms = await taxTermsRegistryAdapter.protocolTaxTerms({
        taxStrategyIdName: TAX_STRATEGIES.FIXED_RATE_TAX,
        universeId: COMMON_ID,
        warper: warperReference,
      });

      expect(terms).toBeDefined();
      expect(terms.name).toBe(TAX_STRATEGIES.FIXED_RATE_TAX);
      expect(terms.data.ratePercent).toBe(COMMON_TAX_RATE);
    });
  });
});