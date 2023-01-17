import { AccountId, AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { AddressTranslator, WARPER_PRESET_ERC721_IDS } from '../../src';
import {
  ERC721Mock,
  IListingTermsRegistry,
  IMetahub,
  ITaxTermsRegistry,
  IUniverseWizardV1,
  IWarperManager,
  IWarperPresetFactory,
} from '../../src/contracts';
import { calculatePricePerSecondInEthers } from '../../src/utils';
import { grantWizardRolesToDeployer } from './acl';
import { makeERC721Asset, mintAndApproveNFTs } from './asset';
import { makeListingParams, makeListingTermsFixedRate, makeListingTermsFixedRateWithReward } from './listing-renting';
import { makeTaxTermsFixedRate, makeTaxTermsFixedRateWithReward } from './tax';
import { makeUniverseParams } from './universe';
import { COMMON_ID, COMMON_PRICE, COMMON_RATE, COMMON_REWARD, SECONDS_IN_DAY, toAccountId } from './utils';
import { findWarperByDeploymentTransaction, getERC721ConfigurablePresetInitData } from './warper';

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
  const universeWizard = (await ethers.getContract('UniverseWizardV1')) as IUniverseWizardV1;
  const baseToken = await ethers.getContract('ERC20Mock');

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

const createUniverseAndWarperWithWizards = async (withReward: boolean): Promise<{ warperReference: AssetType }> => {
  const universeWizard = (await ethers.getContract('UniverseWizardV1')) as IUniverseWizardV1;
  const baseToken = await ethers.getContract('ERC20Mock');
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;
  const collection = await ethers.getContract('ERC721Mock');

  const universeParams = makeUniverseParams('Test Universe', [baseToken.address]);
  const universeWarperTaxTerms = withReward
    ? makeTaxTermsFixedRateWithReward(COMMON_RATE, COMMON_REWARD)
    : makeTaxTermsFixedRate(COMMON_RATE);
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

  return { warperReference: AddressTranslator.createAssetType(toAccountId(warperAddress), 'erc721') };
};

export const createWarper = async (): Promise<WarperCreated> => {
  const warperPresetFactory = (await ethers.getContract('WarperPresetFactory')) as IWarperPresetFactory;
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;
  const collection = await ethers.getContract('ERC721Mock');

  const tx = await warperPresetFactory.deployPreset(
    WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
    getERC721ConfigurablePresetInitData(metahub.address, collection.address),
  );

  const warperAddress = await findWarperByDeploymentTransaction(tx.hash);

  if (!warperAddress) {
    throw new Error('Failed to deploy warper');
  }

  return { warperReference: AddressTranslator.createAssetType(toAccountId(warperAddress), 'erc721') };
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

const createListing = async (
  withReward: boolean,
): Promise<{ txHash: string; listingTerms: IListingTermsRegistry.ListingTermsStruct }> => {
  const lister = await ethers.getNamedSigner('assetOwner');

  const collection = await ethers.getContract('ERC721Mock');
  const listingWizard = await ethers.getContract('ListingWizardV1');

  const listingAssets = [makeERC721Asset(collection.address, 1)];
  const baseRate = calculatePricePerSecondInEthers(COMMON_PRICE, SECONDS_IN_DAY);
  const listingTerms = withReward
    ? makeListingTermsFixedRateWithReward(baseRate, COMMON_REWARD)
    : makeListingTermsFixedRate(baseRate);
  const listingParams = makeListingParams(lister.address);
  const tx = await listingWizard
    .connect(lister)
    .createListingWithTerms(listingAssets, listingParams, listingTerms, SECONDS_IN_DAY * 7, false, COMMON_ID);

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
export const setupForListing = async (
  withReward = false,
): Promise<{
  warperReference: AssetType;
  collectionReference: AssetType;
}> => {
  const lister = await ethers.getNamedSigner('assetOwner');

  const taxTermsRegistry = (await ethers.getContract('TaxTermsRegistry')) as ITaxTermsRegistry;
  const collection = (await ethers.getContract('ERC721Mock')) as ERC721Mock;

  /** Mint NFTs to lister */
  await mintAndApproveNFTs(collection, lister);

  /** Set global tax terms */
  const globalTaxTerms = withReward
    ? makeTaxTermsFixedRateWithReward(COMMON_RATE, COMMON_REWARD)
    : makeTaxTermsFixedRate(COMMON_RATE);
  await taxTermsRegistry.registerProtocolGlobalTaxTerms(globalTaxTerms);

  /** Create universe and warper */
  const { warperReference } = await createUniverseAndWarperWithWizards(withReward);

  return {
    collectionReference: AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
    warperReference,
  };
};

/**
 * Setup with single universe, warper, asset, tax terms and listing
 */
export const setupForRenting = async (
  withReward = false,
): Promise<{
  warperReference: AssetType;
  collectionReference: AssetType;
  listingCreationTxHash: string;
  listingTerms: IListingTermsRegistry.ListingTermsStruct;
}> => {
  const { collectionReference, warperReference } = await setupForListing(withReward);

  /** Create listing */
  const { txHash: listingCreationTxHash, listingTerms } = await createListing(withReward);

  return {
    collectionReference,
    warperReference,
    listingCreationTxHash,
    listingTerms,
  };
};
