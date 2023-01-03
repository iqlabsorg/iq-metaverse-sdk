import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { AccountId, AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  ERC20Mock__factory,
  ERC721Mock__factory,
  IListingManager,
  IListingTermsRegistry,
  IMetahub,
  ITaxTermsRegistry,
  IWarperManager,
  IWarperPresetFactory,
  ListingWizardV1__factory,
  UniverseWizardV1__factory,
} from '../../src/contracts';
import { grantWizardRolesToDeployer } from './acl';
import { createAssetReference, makeERC721Asset, mintAndApproveNFTs } from './asset';
import { makeListingParams, makeListingTermsFixedRate } from './listing-renting';
import { makeTaxTermsFixedRate } from './tax';
import { makeUniverseParams } from './universe';
import { calculateBaseRate, COMMON_ID, SECONDS_IN_DAY, toAccountId } from './utils';
import { findWarperByDeploymentTransaction, getERC721ConfigurablePresetInitData } from './warper';

/** Hard-coded contract addresses (temp solution) */
export const BASE_TOKEN = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const COLLECTION = '0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901';
export const UNIVERSE_WIZARD = '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc';
export const LISTING_WIZARD = '0x82e01223d51Eb87e16A03E24687EDF0F294da6f1';
export const WARPER_WIZARD = '0x162A433068F51e18b7d13932F27e66a3f99E6890';

export type UniverseCreated = {
  universeCreationTxHash: string;
  universeName: string;
  universePaymentTokens: AccountId[];
};

export type WarperCreated = {
  warperReference: AssetType;
};

export type WarperCreatedAndRegistered = {
  warperName: string;
  warperReference: AssetType;
};

const createUniverse = async (): Promise<UniverseCreated> => {
  const deployer = await ethers.getNamedSigner('deployer');

  const universeWizard = new UniverseWizardV1__factory().attach(UNIVERSE_WIZARD).connect(deployer);
  const baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);

  const universeName = 'Test Universe';
  const universePaymentTokens = [baseToken.address];
  const universeParams = makeUniverseParams(universeName, universePaymentTokens);
  const tx = await universeWizard.setupUniverse(universeParams);
  return {
    universeCreationTxHash: tx.hash,
    universeName,
    universePaymentTokens: universePaymentTokens.map(x => toAccountId(x)),
  };
};

const createUniverseAndWarperWithWizards = async (): Promise<{ warperReference: AssetType }> => {
  const deployer = await ethers.getNamedSigner('deployer');

  const universeWizard = new UniverseWizardV1__factory().attach(UNIVERSE_WIZARD).connect(deployer);
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;
  const baseToken = new ERC20Mock__factory().attach(BASE_TOKEN);
  const collection = new ERC721Mock__factory().attach(COLLECTION);

  const universeParams = makeUniverseParams('Test Universe', [baseToken.address]);
  const universeWarperTaxTerms = makeTaxTermsFixedRate('1');
  const warperParams = {
    name: 'Warper',
    universeId: BigNumber.from(0), // will be replaced on-chain with actual
    paused: false,
  };
  const tx = await universeWizard.setupUniverseAndWarper(
    universeParams,
    universeWarperTaxTerms,
    ethers.constants.AddressZero,
    warperParams,
    WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
    getERC721ConfigurablePresetInitData(metahub.address, collection.address),
  );

  const warperAddress = await findWarperByDeploymentTransaction(tx.hash);

  if (!warperAddress) {
    throw new Error('Failed to deploy warper');
  }

  return { warperReference: createAssetReference('erc721', warperAddress) };
};

const createWarper = async (): Promise<WarperCreated> => {
  const warperPresetFactory = (await ethers.getContract('WarperPresetFactory')) as IWarperPresetFactory;
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;

  const tx = await warperPresetFactory.deployPreset(
    WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
    getERC721ConfigurablePresetInitData(metahub.address, COLLECTION),
  );

  const warperAddress = await findWarperByDeploymentTransaction(tx.hash);

  if (!warperAddress) {
    throw new Error('Failed to deploy warper');
  }

  return { warperReference: createAssetReference('erc721', warperAddress) };
};

const createAndRegisterWarper = async (): Promise<WarperCreatedAndRegistered> => {
  const warperManager = (await ethers.getContract('WarperManager')) as IWarperManager;

  const { warperReference } = await createWarper();
  const warperName = 'Test Warper';

  await warperManager.registerWarper(warperReference.assetName.reference, {
    name: warperName,
    universeId: COMMON_ID,
    paused: false,
  });

  return { warperName, warperReference };
};

const createListing = async (): Promise<{ txHash: string; listingTerms: IListingTermsRegistry.ListingTermsStruct }> => {
  const lister = await ethers.getNamedSigner('assetOwner');

  const collection = new ERC721Mock__factory().attach(COLLECTION);
  const listingWizard = new ListingWizardV1__factory().attach(LISTING_WIZARD).connect(lister);

  const listingAssets = [makeERC721Asset(collection.address, 1)];
  const baseRate = calculateBaseRate('100', SECONDS_IN_DAY);
  const listingTerms = makeListingTermsFixedRate(baseRate);
  const listingParams = makeListingParams(lister.address);
  const tx = await listingWizard.createListingWithTerms(
    listingAssets,
    listingParams,
    listingTerms,
    SECONDS_IN_DAY * 7,
    false,
    COMMON_ID,
  );

  return { txHash: tx.hash, listingTerms };
};

/** Creates universe */
export const setupUniverse = async (): Promise<UniverseCreated> => {
  await grantWizardRolesToDeployer();
  return createUniverse();
};

/** Creates universe with unregistered warper */
export const setupUniverseAndWarper = async (): Promise<{
  universeData: UniverseCreated;
  warperData: WarperCreated;
}> => {
  const universeData = await setupUniverse();
  const warperData = await createWarper();
  return { universeData, warperData };
};

/** Creates universe with registered warper */
export const setupUniverseAndRegisteredWarper = async (): Promise<{
  universeData: UniverseCreated;
  warperData: WarperCreatedAndRegistered;
}> => {
  const universeData = await setupUniverse();
  const warperData = await createAndRegisterWarper();
  return { universeData, warperData };
};

/**
 * Setup with single universe, warper, asset and tax terms
 */
export const setupForListing = async (): Promise<{
  warperReference: AssetType;
  collectionReference: AssetType;
}> => {
  const lister = await ethers.getNamedSigner('assetOwner');

  const taxTermsRegistry = (await ethers.getContract('TaxTermsRegistry')) as ITaxTermsRegistry;
  const collection = new ERC721Mock__factory().attach(COLLECTION);

  /** Mint NFTs to lister */
  await mintAndApproveNFTs(collection, lister);

  /** Set global tax terms */
  const globalTaxTerms = makeTaxTermsFixedRate('1');
  await taxTermsRegistry.registerProtocolGlobalTaxTerms(globalTaxTerms);

  /** Create universe and warper */
  const { warperReference } = await createUniverseAndWarperWithWizards();

  return {
    collectionReference: createAssetReference('erc721', collection.address),
    warperReference,
  };
};

/**
 * Setup with single universe, warper, asset, tax terms and listing
 */
export const setupForRenting = async (): Promise<{
  warperReference: AssetType;
  collectionReference: AssetType;
  listingCreationTxHash: string;
  listingTerms: IListingTermsRegistry.ListingTermsStruct;
}> => {
  const { collectionReference, warperReference } = await setupForListing();

  /** Create listing */
  const { txHash: listingCreationTxHash, listingTerms } = await createListing();

  return {
    collectionReference,
    warperReference,
    listingCreationTxHash,
    listingTerms,
  };
};
