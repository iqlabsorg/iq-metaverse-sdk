import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { deployments, ethers } from 'hardhat';
import { Multiverse, WarperManagerAdapter } from '../src';
import { IWarperManager, IWarperPresetFactory } from '../src/contracts';
import { createAssetReference } from './helpers/asset';
import { COLLECTION, warperSetup } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('WarperManagerAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let random: SignerWithAddress;

  /** Contracts */
  let warperManager: IWarperManager;
  let warperPresetFactory: IWarperPresetFactory;

  /** SDK */
  let multiverse: Multiverse;
  let warperManagerAdapter: WarperManagerAdapter;

  /** Data Structs */
  let warperReference: AssetType;
  let warperName: string;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [random] = await ethers.getUnnamedSigners();

    warperManager = await ethers.getContract('WarperManager');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');

    multiverse = await Multiverse.init({ signer: deployer });
    warperManagerAdapter = multiverse.warperManager(toAccountId(warperManager.address));

    ({ warperName, warperReference } = await warperSetup());
  });

  describe('pauseWarper', () => {
    beforeEach(async () => {
      await warperManagerAdapter.pauseWarper(warperReference);
    });

    it('should pause the warper', async () => {
      const info = await warperManager.warperInfo(warperReference.assetName.reference);
      expect(info.paused).toBe(true);
    });

    describe('unpauseWarper', () => {
      it('should unpause the warper', async () => {
        await warperManagerAdapter.unpauseWarper(warperReference);
        const info = await warperManager.warperInfo(warperReference.assetName.reference);
        expect(info.paused).toBe(false);
      });
    });
  });

  describe('universeWarperCount', () => {
    it('should return number of warpers registered in the universe', async () => {
      const count = await warperManagerAdapter.universeWarperCount(COMMON_ID);
      expect(count.toBigInt()).toBe(1n);
    });
  });

  describe('universeWarpers', () => {
    it('should return a list of warpers registered in the universe', async () => {
      const warpers = await warperManagerAdapter.universeWarpers(COMMON_ID, 0, 1);
      expect(warpers.length).toBeGreaterThan(0);
      expect(warpers[0].name).toBe(warperName);
      expect(warpers[0].self).toMatchObject(warperReference);
    });
  });

  describe('universeAssetWarperCount', () => {
    describe('when asset does not have a warper', () => {
      it('should return 0', async () => {
        const count = await warperManagerAdapter.universeAssetWarperCount(
          COMMON_ID,
          createAssetReference('erc721', random.address),
        );
        expect(count.toBigInt()).toBe(0n);
      });
    });

    describe('when asset has a warper', () => {
      it('should return warper count', async () => {
        const count = await warperManagerAdapter.universeAssetWarperCount(
          COMMON_ID,
          createAssetReference('erc721', COLLECTION),
        );
        expect(count.toBigInt()).toBe(1n);
      });
    });
  });

  describe('universeAssetWarpers', () => {
    it('should return asset warpers', async () => {
      const warpers = await warperManagerAdapter.universeAssetWarpers(
        COMMON_ID,
        createAssetReference('erc721', COLLECTION),
        0,
        1,
      );
      expect(warpers.length).toBeGreaterThan(0);
      expect(warpers[0].name).toBe(warperName);
      expect(warpers[0].self).toMatchObject(warperReference);
    });
  });

  describe('isWarperAdmin', () => {
    it('should return false if account is not warper admin', async () => {
      const isAdmin = await warperManagerAdapter.isWarperAdmin(warperReference, toAccountId(random.address));
      expect(isAdmin).toBe(false);
    });

    it('should return true if account is warper admin', async () => {
      const isAdmin = await warperManagerAdapter.isWarperAdmin(warperReference, toAccountId(deployer.address));
      expect(isAdmin).toBe(true);
    });
  });

  describe('warper', () => {
    it('should return info about warper', async () => {
      const warper = await warperManagerAdapter.warper(warperReference);
      expect(warper.name).toBe(warperName);
      expect(warper.self).toMatchObject(warperReference);
    });
  });
});
