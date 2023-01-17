import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { AddressTranslator, IQSpace, WarperPresetFactoryAdapter } from '../src';
import { ERC721Mock, IMetahub, IWarperPresetFactory } from '../src/contracts';
import { setupUniverse } from './helpers/setup';
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
  let collection: ERC721Mock;

  /** SDK */
  let iqspace: IQSpace;
  let warperPresetFactoryAdapter: WarperPresetFactoryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    metahub = await ethers.getContract('Metahub');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    collection = await ethers.getContract('ERC721Mock');

    iqspace = await IQSpace.init({ signer: deployer });
    warperPresetFactoryAdapter = iqspace.warperPresetFactory(toAccountId(warperPresetFactory.address));

    await setupUniverse();
  });

  describe('deployPreset', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      tx = await warperPresetFactoryAdapter.deployPreset('ERC721ConfigurablePreset', {
        metahub: toAccountId(metahub.address),
        original: AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
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
        reference = AddressTranslator.createAssetType(toAccountId(warper!), 'erc721');
      });

      it('should return warper reference from deployment transaction', async () => {
        const warperReference = await warperPresetFactoryAdapter.findWarperByDeploymentTransaction(tx.hash);
        expect(warperReference).toBeDefined();
        expect(warperReference).toMatchObject(reference);
      });
    });
  });
});
