import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { ERC721AssetVaultAdapter, IQSpace } from '../src';
import { IERC721AssetVault } from '../src/contracts';
import { toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ERC721AssetVaultAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let assetVault: IERC721AssetVault;
  let metahub: Contract;

  /** SDK */
  let assetVaultAdapter: ERC721AssetVaultAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    assetVault = await ethers.getContract('ERC721AssetVault');
    metahub = await ethers.getContract('Metahub');

    const iqSpace = await IQSpace.init({ signer: deployer });
    assetVaultAdapter = iqSpace.erc721AssetVault(toAccountId(assetVault.address));
  });

  describe('switchToRecoveryMode', () => {
    it('should switch to recovery mode', async () => {
      await assetVaultAdapter.switchToRecoveryMode();
      expect(await assetVault.isRecovery()).to.be.eq(true);
    });
  });

  describe('isRecovery', () => {
    describe('when not in recovery mode', () => {
      it('should return false', async () => {
        expect(await assetVaultAdapter.isRecovery()).to.be.eq(false);
      });
    });

    describe('when in recovery mode', () => {
      beforeEach(async () => {
        await assetVault.switchToRecoveryMode();
      });

      it('should return true', async () => {
        expect(await assetVaultAdapter.isRecovery()).to.be.eq(true);
      });
    });
  });

  describe('assetClass', () => {
    it('should return asset class', async () => {
      expect(await assetVaultAdapter.assetClass()).to.be.eq('erc721');
    });
  });

  describe('metahub', () => {
    it('should return metahub account id', async () => {
      expect(await assetVaultAdapter.metahub()).to.be.eql(toAccountId(metahub.address));
    });
  });
});
