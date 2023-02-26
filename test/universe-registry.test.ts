import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AccountId } from 'caip';
import { deployments, ethers } from 'hardhat';
import { IQSpace, UniverseRegistryAdapter } from '../src';
import { IUniverseRegistry, IUniverseWizardV1 } from '../src/contracts';
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
      expect(data).toBeDefined();
      expect(data?.name).toBe(universeName);
      expect(data?.paymentTokens).toMatchObject(universePaymentTokens);
      expect(data?.id.toBigInt()).toBe(COMMON_ID.toBigInt());
    });
  });

  describe('isUniverseOwner', () => {
    describe('when user is not universe owner', () => {
      it('should return false', async () => {
        const isOwner = await universeRegistryAdapter.isUniverseOwner(COMMON_ID, toAccountId(random.address));
        expect(isOwner).toBe(false);
      });
    });

    describe('when user is universe owner', () => {
      it('should return true', async () => {
        const isOwner = await universeRegistryAdapter.isUniverseOwner(COMMON_ID, toAccountId(deployer.address));
        expect(isOwner).toBe(true);
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
      expect(info.name).toBe(newName);
    });
  });

  describe('universeInfo', () => {
    it('should return universe info', async () => {
      const info = await universeRegistryAdapter.universeInfo(COMMON_ID);
      expect(info).toBeDefined();
      expect(info.name).toBe(universeName);
      expect(info.paymentTokens).toMatchObject(universePaymentTokens);
    });
  });

  describe('universeToken', () => {
    it('should return reference to universe token', async () => {
      const tokenDirect = await universeRegistry.universeToken();
      const tokenSdk = await universeRegistryAdapter.universeToken();
      expect(tokenSdk.assetName.reference).toBe(tokenDirect);
    });
  });

  describe('universeTokenBaseURI', () => {
    it('should return universe token base uri', async () => {
      const uriDirect = await universeRegistry.universeTokenBaseURI();
      const uriSdk = await universeRegistryAdapter.universeTokenBaseURI();
      expect(uriSdk).toBe(uriDirect);
    });
  });

  describe('setUniverseTokenBaseURI', () => {
    const baseUri = 'ipfs://universe';

    beforeEach(async () => {
      await universeRegistryAdapter.setUniverseTokenBaseURI(baseUri);
    });

    it('should set universe base token uri', async () => {
      const uri = await universeRegistry.universeTokenBaseURI();
      expect(uri).toBe(baseUri);
    });
  });

  describe('registerUniversePaymentToken', () => {
    beforeEach(async () => {
      await universeRegistryAdapter.registerUniversePaymentToken(COMMON_ID, toAccountId(random.address));
    });

    it('should add new payment token to universe', async () => {
      const info = await universeRegistry.universe(COMMON_ID);
      expect(info.paymentTokens).toContain(random.address);
    });
  });

  describe('removeUniversePaymentToken', () => {
    beforeEach(async () => {
      await universeRegistry.registerUniversePaymentToken(COMMON_ID, random.address);
      await universeRegistry.removeUniversePaymentToken(COMMON_ID, universePaymentTokens[0].address);
    });

    it('should remove payment token from universe', async () => {
      const info = await universeRegistry.universe(COMMON_ID);
      expect(info.paymentTokens).toContain(random.address);
      expect(info.paymentTokens).not.toContain(universePaymentTokens[0]);
    });
  });

  describe('isUniverseWizard', () => {
    describe('if account is not universe wizard', () => {
      it('should return false', async () => {
        const isWizard = await universeRegistryAdapter.isUniverseWizard(toAccountId(random.address));
        expect(isWizard).toBe(false);
      });
    });

    describe('if account is universe wizard', () => {
      it('should return true', async () => {
        const isWizard = await universeRegistryAdapter.isUniverseWizard(toAccountId(universeWizard.address));
        expect(isWizard).toBe(true);
      });
    });
  });
});
