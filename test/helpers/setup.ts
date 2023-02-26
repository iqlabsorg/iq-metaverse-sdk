import { AccountId, AssetType } from 'caip';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { AddressTranslator } from '../../src';
import {
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry,
  IListingWizardV1,
  IMetahub,
  ITaxTermsRegistry,
  IUniverseWizardV1,
  IWarperManager,
  IWarperPresetFactory,
} from '../../src/contracts';
import { grantWizardRolesToDeployer } from './acl';
import { mintAndApproveNFTs } from './asset';
import { COMMON_BASE_RATE, COMMON_ID, COMMON_REWARD_RATE, COMMON_TAX_RATE, SECONDS_IN_DAY, toAccountId } from './utils';
import { findWarperByDeploymentTransaction } from './warper';
import { makeUniverseParams } from '@iqprotocol/iq-space-protocol/src/protocol/universe/typechain-helpers';
import { makeFixedRateWithRewardTaxTermsFromUnconverted } from '@iqprotocol/iq-space-protocol/src/protocol/tax/fixed-rate-with-reward/helpers';
import { makeFixedRateTaxTermsFromUnconverted } from '@iqprotocol/iq-space-protocol/src/protocol/tax/fixed-rate/helpers';
import { ERC721_WARPER_PRESET_IDS } from '@iqprotocol/iq-space-protocol/src/protocol/warper/v1-controller/ERC721/constants';
import { makeWarperPresetInitData } from '@iqprotocol/iq-space-protocol/src/protocol/warper/helpers';
import { makeERC721Asset } from '@iqprotocol/iq-space-protocol/src/protocol/asset/ERC721/typechain-helpers';
import { makeListingParams } from '@iqprotocol/iq-space-protocol/src/protocol/listing/typechain-helpers';
import { makeFixedRateWithRewardListingTermsFromUnconverted } from '@iqprotocol/iq-space-protocol/src/protocol/listing/fixed-rate-with-reward/helpers';
import { makeFixedRateListingTermsFromUnconverted } from '@iqprotocol/iq-space-protocol/src/protocol/listing/fixed-rate/helpers';

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
    ? makeFixedRateWithRewardTaxTermsFromUnconverted(COMMON_TAX_RATE, COMMON_REWARD_RATE)
    : makeFixedRateTaxTermsFromUnconverted(COMMON_TAX_RATE);
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
    ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
    makeWarperPresetInitData(collection.address, metahub.address),
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
    ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
    makeWarperPresetInitData(collection.address, metahub.address),
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

const createListingWithTerms = async (
  withReward: boolean,
): Promise<{ txHash: string; listingTerms: IListingTermsRegistry.ListingTermsStruct }> => {
  const lister = await ethers.getNamedSigner('assetOwner');

  const collection = await ethers.getContract('ERC721Mock');
  const listingWizard = (await ethers.getContract('ListingWizardV1')) as IListingWizardV1;

  const listingAssets = [makeERC721Asset(collection.address, 1)];
  const listingTerms = withReward
    ? makeFixedRateWithRewardListingTermsFromUnconverted(COMMON_BASE_RATE, COMMON_REWARD_RATE)
    : makeFixedRateListingTermsFromUnconverted(COMMON_BASE_RATE);
  const listingParams = makeListingParams(lister.address);
  const tx = await listingWizard
    .connect(lister)
    .createListingWithTerms(listingAssets, listingParams, listingTerms, SECONDS_IN_DAY * 7, false, COMMON_ID);

  return { txHash: tx.hash, listingTerms };
};

export const createListing = async (): Promise<void> => {
  const lister = await ethers.getNamedSigner('assetOwner');
  const collection = (await ethers.getContract('ERC721Mock')) as ERC721Mock;
  const listingManager = (await ethers.getContract('ListingManager')) as IListingManager;

  /** Mint NFTs to lister */
  await mintAndApproveNFTs(collection, lister);

  /** Grant wizard roles to deployer */
  await grantWizardRolesToDeployer();

  /** Create listing */
  const listingAssets = [makeERC721Asset(collection.address, 1)];
  const listingParams = makeListingParams(lister.address);
  await listingManager.createListing(listingAssets, listingParams, SECONDS_IN_DAY * 7, true);
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
    ? makeFixedRateWithRewardTaxTermsFromUnconverted(COMMON_TAX_RATE, COMMON_REWARD_RATE)
    : makeFixedRateTaxTermsFromUnconverted(COMMON_TAX_RATE);
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
  const { txHash: listingCreationTxHash, listingTerms } = await createListingWithTerms(withReward);

  return {
    collectionReference,
    warperReference,
    listingCreationTxHash,
    listingTerms,
  };
};
