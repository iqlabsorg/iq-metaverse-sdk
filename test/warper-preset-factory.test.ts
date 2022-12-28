import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { Multiverse, WarperPresetFactoryAdapter } from '../src';
import { IMetahub, IWarperPresetFactory } from '../src/contracts';
import { createAssetReference } from './helpers/asset';
import { COLLECTION, setupUniverse } from './helpers/setup';
import { toAccountId } from './helpers/utils';
import { findWarperByDeploymentTransaction } from './helpers/warper';

/**
 * @group integration
 */
describe('WarperPresetFactoryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let warperPresetFactory: IWarperPresetFactory;

  /** SDK */
  let multiverse: Multiverse;
  let warperPresetFactoryAdapter: WarperPresetFactoryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    metahub = await ethers.getContract('Metahub');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');

    multiverse = await Multiverse.init({ signer: deployer });
    warperPresetFactoryAdapter = multiverse.warperPresetFactory(toAccountId(warperPresetFactory.address));

    await setupUniverse();
  });

  describe('deployPreset', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      tx = await warperPresetFactoryAdapter.deployPreset('ERC721ConfigurablePreset', {
        metahub: toAccountId(metahub.address),
        original: createAssetReference('erc721', COLLECTION),
      });
    });

    it('should deploy warper from a preset', async () => {
      const warper = await findWarperByDeploymentTransaction(tx.hash);
      expect(warper).toBeDefined();
      expect(warper?.length).toBeGreaterThan(0);
    });

    describe('findWarperByDeploymentTransaction', () => {
      let reference: AssetType;

      beforeEach(async () => {
        const warper = await findWarperByDeploymentTransaction(tx.hash);
        reference = createAssetReference('erc721', warper!);
      });

      it('should return warper reference from deployment transaction', async () => {
        const warperReference = await warperPresetFactoryAdapter.findWarperByDeploymentTransaction(tx.hash);
        expect(warperReference).toBeDefined();
        expect(warperReference).toMatchObject(reference);
      });
    });
  });
});
