import { LISTING_CONFIGURATOR_PRESET_IDS } from '@iqprotocol/iq-space-protocol';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { IQSpace, ListingConfiguratorPreset, ListingConfiguratorPresetFactoryAdapter } from '../src';
import { IListingConfiguratorPresetFactory } from '../src/contracts';
import { toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ListingConfiguratorPresetFactoryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let presetFactory: IListingConfiguratorPresetFactory;
  let generalGuildPreset: Contract;

  /** SDK */
  let presetFactoryAdapter: ListingConfiguratorPresetFactoryAdapter;
  let deployedPreset: ListingConfiguratorPreset;

  const presetId = LISTING_CONFIGURATOR_PRESET_IDS.GENERAL_GUILD_PRESET;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    presetFactory = await ethers.getContract('ListingConfiguratorPresetFactory');
    generalGuildPreset = await ethers.getContract('GeneralGuildPreset');

    const iqSpace = await IQSpace.init({ signer: deployer });
    presetFactoryAdapter = iqSpace.listingConfiguratorPresetFactory(toAccountId(presetFactory.address));

    deployedPreset = {
      id: presetId,
      implementation: toAccountId(generalGuildPreset.address),
      enabled: true,
    };
  });

  describe('addPreset', () => {
    beforeEach(async () => {
      await presetFactory.removePreset(presetId);
    });

    it('should add preset', async () => {
      await presetFactoryAdapter.addPreset(presetId, toAccountId(generalGuildPreset.address));
      expect((await presetFactory.presets()).length).toBe(1);
    });
  });

  describe('removePreset', () => {
    it('should remove preset', async () => {
      await presetFactoryAdapter.removePreset(presetId);
      expect((await presetFactory.presets()).length).toBe(0);
    });
  });

  describe('enablePreset', () => {
    beforeEach(async () => {
      await presetFactory.disablePreset(presetId);
    });

    it('should enable preset', async () => {
      await presetFactoryAdapter.enablePreset(presetId);
      expect(await presetFactory.presetEnabled(presetId)).toBe(true);
    });
  });

  describe('disablePreset', () => {
    it('should disable preset', async () => {
      await presetFactoryAdapter.disablePreset(presetId);
      expect(await presetFactory.presetEnabled(presetId)).toBe(false);
    });
  });

  describe('presetEnabled', () => {
    describe('when not enabled', () => {
      beforeEach(async () => {
        await presetFactory.disablePreset(presetId);
      });

      it('should return false', async () => {
        expect(await presetFactoryAdapter.presetEnabled(presetId)).toBe(false);
      });
    });

    describe('when enabled', () => {
      it('should return true', async () => {
        expect(await presetFactoryAdapter.presetEnabled(presetId)).toBe(true);
      });
    });
  });

  describe('preset', () => {
    it('should return preset by id', async () => {
      expect(await presetFactoryAdapter.preset(presetId)).toMatchObject(deployedPreset);
    });
  });

  describe('presets', () => {
    it('should return list of registered presets', async () => {
      const presets = await presetFactoryAdapter.presets();
      expect(presets.length).toBe(1);
      expect(presets[0]).toMatchObject(deployedPreset);
    });
  });
});
