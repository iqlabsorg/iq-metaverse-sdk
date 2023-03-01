import { IUniverseRegistry, IUniverseWizardV1 } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId } from 'caip';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { IQSpace, UniverseRegistryAdapter } from '../src';
import { setupUniverse } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('UniverseRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let random: SignerWithAddress;

  /** Contracts */
  let universeRegistry: IUniverseRegistry;
  let universeWizard: IUniverseWizardV1;

  /** SDK */
  let iqspace: IQSpace;
  let universeRegistryAdapter: UniverseRegistryAdapter;

  /** Data Structs */
  let universeCreationTxHash: string;
  let universeName: string;
  let universePaymentTokens: AccountId[];

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [random] = await ethers.getUnnamedSigners();

    universeRegistry = await ethers.getContract('UniverseRegistry');
    universeWizard = await ethers.getContract('UniverseWizardV1');

    iqspace = await IQSpace.init({ signer: deployer });
    universeRegistryAdapter = iqspace.universeRegistry(toAccountId(universeRegistry.address));

    ({ universeCreationTxHash, universeName, universePaymentTokens } = await setupUniverse());
  });

  describe('findUniverseByCreationTransaction', () => {
    it('should return universe creation data (info)', async () => {
      const data = await universeRegistryAdapter.findUniverseByCreationTransaction(universeCreationTxHash);
      expect(data).to.be.deep.equal({ name: universeName, paymentTokens: universePaymentTokens, id: COMMON_ID });
    });
  });

  describe('isUniverseOwner', () => {
    describe('when user is not universe owner', () => {
      it('should return false', async () => {
        const isOwner = await universeRegistryAdapter.isUniverseOwner(COMMON_ID, toAccountId(random.address));
        expect(isOwner).to.be.eq(false);
      });
    });

    describe('when user is universe owner', () => {
      it('should return true', async () => {
        const isOwner = await universeRegistryAdapter.isUniverseOwner(COMMON_ID, toAccountId(deployer.address));
        expect(isOwner).to.be.eq(true);
      });
    });
  });

  describe('setUniverseName', () => {
    const newName = 'New name';

    beforeEach(async () => {
      await universeRegistryAdapter.setUniverseName(COMMON_ID, newName);
    });

    it('should change the name of the universe', async () => {
      const info = await universeRegistry.universe(COMMON_ID);
      expect(info.name).to.be.eq(newName);
    });
  });

  describe('universeInfo', () => {
    it('should return universe info', async () => {
      const info = await universeRegistryAdapter.universeInfo(COMMON_ID);
      expect(info.name).to.be.eq(universeName);
      expect(info.paymentTokens).to.be.deep.equal(universePaymentTokens);
    });
  });

  describe('universeToken', () => {
    it('should return reference to universe token', async () => {
      const tokenDirect = await universeRegistry.universeToken();
      const tokenSdk = await universeRegistryAdapter.universeToken();
      expect(tokenSdk.assetName.reference).to.be.eq(tokenDirect);
    });
  });

  describe('universeTokenBaseURI', () => {
    it('should return universe token base uri', async () => {
      const uriDirect = await universeRegistry.universeTokenBaseURI();
      const uriSdk = await universeRegistryAdapter.universeTokenBaseURI();
      expect(uriSdk).to.be.eq(uriDirect);
    });
  });

  describe('setUniverseTokenBaseURI', () => {
    const baseUri = 'ipfs://universe';

    beforeEach(async () => {
      await universeRegistryAdapter.setUniverseTokenBaseURI(baseUri);
    });

    it('should set universe base token uri', async () => {
      const uri = await universeRegistry.universeTokenBaseURI();
      expect(uri).to.be.eq(baseUri);
    });
  });

  describe('registerUniversePaymentToken', () => {
    beforeEach(async () => {
      await universeRegistryAdapter.registerUniversePaymentToken(COMMON_ID, toAccountId(random.address));
    });

    it('should add new payment token to universe', async () => {
      const info = await universeRegistry.universe(COMMON_ID);
      expect(info.paymentTokens).to.include(random.address);
    });
  });

  describe('removeUniversePaymentToken', () => {
    beforeEach(async () => {
      await universeRegistry.registerUniversePaymentToken(COMMON_ID, random.address);
      await universeRegistry.removeUniversePaymentToken(COMMON_ID, universePaymentTokens[0].address);
    });

    it('should remove payment token from universe', async () => {
      const info = await universeRegistry.universe(COMMON_ID);
      expect(info.paymentTokens).to.include(random.address);
      expect(info.paymentTokens).to.not.include(universePaymentTokens[0]);
    });
  });

  describe('isUniverseWizard', () => {
    describe('if account is not universe wizard', () => {
      it('should return false', async () => {
        const isWizard = await universeRegistryAdapter.isUniverseWizard(toAccountId(random.address));
        expect(isWizard).to.be.eq(false);
      });
    });

    describe('if account is universe wizard', () => {
      it('should return true', async () => {
        const isWizard = await universeRegistryAdapter.isUniverseWizard(toAccountId(universeWizard.address));
        expect(isWizard).to.be.eq(true);
      });
    });
  });
});
