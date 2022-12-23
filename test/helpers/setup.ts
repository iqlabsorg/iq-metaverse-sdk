import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  ERC20Mock__factory,
  ERC721Mock__factory,
  IMetahub,
  ITaxTermsRegistry,
  IWarperManager,
  ListingWizardV1__factory,
  UniverseWizardV1__factory,
} from '../../src/contracts';
import { createAssetReference, makeERC721Asset, mintAndApproveNFTs } from './asset';
import { calculateBaseRate, COMMON_ID, SECONDS_IN_DAY } from './utils';
import { makeListingParams, makeListingTermsFixedRate } from './listing-renting';
import { makeTaxTermsFixedRate } from './tax';
import { makeUniverseParams } from './universe';
import { getERC721ConfigurablePresetInitData } from './warper';
import { AssetType } from 'caip';

/**
 * Basic listing & renting setup with single universe, warper, asset and listing
 */
export const listingAndRentingSetup = async (): Promise<{
  warperReference: AssetType;
  collectionReference: AssetType;
}> => {
  const deployer = await ethers.getNamedSigner('deployer');
  const lister = await ethers.getNamedSigner('assetOwner');

  const universeWizard = new UniverseWizardV1__factory()
    .attach('0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc')
    .connect(deployer);
  const listingWizard = new ListingWizardV1__factory()
    .attach('0x82e01223d51Eb87e16A03E24687EDF0F294da6f1')
    .connect(lister);
  const metahub = (await ethers.getContract('Metahub')) as IMetahub;
  const taxTermsRegistry = (await ethers.getContract('TaxTermsRegistry')) as ITaxTermsRegistry;
  const baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');
  const collection = new ERC721Mock__factory().attach('0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901');

  /** Mint NFTs to lister */
  await mintAndApproveNFTs(collection, lister);

  /** Set global tax terms */
  const globalTaxTerms = makeTaxTermsFixedRate('1');
  await taxTermsRegistry.registerProtocolGlobalTaxTerms(globalTaxTerms);

  /** Create universe and warper */
  const universeParams = makeUniverseParams('Test Universe', [baseToken.address]);
  const universeWarperTaxTerms = makeTaxTermsFixedRate('1');
  const warperParams = {
    name: 'Warper',
    universeId: BigNumber.from(0), // will be replaced on-chain with actual
    paused: false,
  };
  await universeWizard.setupUniverseAndWarper(
    universeParams,
    universeWarperTaxTerms,
    ethers.constants.AddressZero,
    warperParams,
    WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
    getERC721ConfigurablePresetInitData(metahub.address, collection.address),
  );

  /** Create listing */
  const listingAssets = [makeERC721Asset(collection.address, 1)];
  const baseRate = calculateBaseRate('100', SECONDS_IN_DAY);
  const listingTerms = makeListingTermsFixedRate(baseRate);
  const listingParams = makeListingParams(lister.address);
  await listingWizard.createListingWithTerms(
    listingAssets,
    listingParams,
    listingTerms,
    SECONDS_IN_DAY * 7,
    true,
    COMMON_ID,
  );

  const warperManager = (await ethers.getContract('WarperManager')) as IWarperManager;
  const [addresses] = await warperManager.universeWarpers(COMMON_ID, 0, 1);
  const warperAddress = addresses[0];

  return {
    collectionReference: createAssetReference('erc721', collection.address),
    warperReference: createAssetReference('erc721', warperAddress),
  };
};

export const universeSetup = async (): Promise<{
  universeCreationTxHash: string;
  universeName: string;
  universePaymentTokens: string[];
}> => {
  const deployer = await ethers.getNamedSigner('deployer');

  const universeWizard = new UniverseWizardV1__factory()
    .attach('0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc')
    .connect(deployer);
  const baseToken = new ERC20Mock__factory().attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

  const universeName = 'Test Universe';
  const universePaymentTokens = [baseToken.address];
  const universeParams = makeUniverseParams(universeName, universePaymentTokens);
  const tx = await universeWizard.setupUniverse(universeParams);
  return { universeCreationTxHash: tx.hash, universeName, universePaymentTokens };
};
