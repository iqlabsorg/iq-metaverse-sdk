import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployments, ethers } from 'hardhat';
import {
  IQSpace,
  ListingStrategyRegistryAdapter,
  LISTING_STRATEGY_IDS,
  solidityIdBytes4,
  TAX_STRATEGY_IDS,
} from '../src';
import { IFixedRateListingController, IFixedRateTaxController, IListingStrategyRegistry } from '../src/contracts';
import { toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ListingStrategyRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let listingStrategyRegistry: IListingStrategyRegistry;
  let controller: IFixedRateListingController;
  let taxController: IFixedRateTaxController;

  /** SDK */
  let listingStrategyRegistryAdapter: ListingStrategyRegistryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    listingStrategyRegistry = await ethers.getContract('ListingStrategyRegistry');
    controller = await ethers.getContract('FixedRateListingController');
    taxController = await ethers.getContract('FixedRateTaxController');

    const iqSpace = await IQSpace.init({ signer: deployer });
    listingStrategyRegistryAdapter = iqSpace.listingStrategyRegistry(toAccountId(listingStrategyRegistry.address));
  });

  describe('listingController', () => {
    it('should return listing strategy controller', async () => {
      expect(await listingStrategyRegistryAdapter.listingController(LISTING_STRATEGY_IDS.FIXED_RATE)).toMatchObject(
        toAccountId(controller.address),
      );
    });
  });

  describe('listingTaxId', () => {
    it('should return tax strategy id for listing strategy', async () => {
      expect(await listingStrategyRegistryAdapter.listingTaxId(LISTING_STRATEGY_IDS.FIXED_RATE)).toBe(
        TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      );
    });
  });

  describe('listingStrategy', () => {
    it('should return listing strategy configuration', async () => {
      expect(await listingStrategyRegistryAdapter.listingStrategy(LISTING_STRATEGY_IDS.FIXED_RATE)).toMatchObject({
        controller: toAccountId(controller.address),
        taxStrategyId: TAX_STRATEGY_IDS.FIXED_RATE_TAX,
      });
    });
  });

  describe('listingTaxController', () => {
    it('should return tax controller account ID for listing strategy', async () => {
      expect(await listingStrategyRegistryAdapter.listingTaxController(LISTING_STRATEGY_IDS.FIXED_RATE)).toMatchObject(
        toAccountId(taxController.address),
      );
    });
  });

  describe('isRegisteredListingStrategy', () => {
    describe('when strategy is not registered', () => {
      it('should return false', async () => {
        expect(await listingStrategyRegistryAdapter.isRegisteredListingStrategy(solidityIdBytes4('gibberish'))).toBe(
          false,
        );
      });
    });

    describe('when strategy is registered', () => {
      it('should return true', async () => {
        expect(await listingStrategyRegistryAdapter.isRegisteredListingStrategy(LISTING_STRATEGY_IDS.FIXED_RATE)).toBe(
          true,
        );
      });
    });
  });
});
