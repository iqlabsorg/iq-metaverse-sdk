# IQ Space NFT Renting

[![CI](https://github.com/iqlabsorg/iq-space-sdk-js/actions/workflows/main.yml/badge.svg)](https://github.com/iqlabsorg/iq-space-sdk-js/actions/workflows/main.yml)

This package is part of [IQ Protocol JS SDK.](https://github.com/iqlabsorg/iq-space-sdk-js)

| :exclamation: The package is in development and breaking changes should be expected. Use at your own risk! |
| :--------------------------------------------------------------------------------------------------------- |

This package provides higher level abstraction over IQ Protocol smart contracts, allowing application developers to work with IQ NFT renting platform regardless of the underlying blockchain.

Use this package to create IQVerse, deploy Warper and communicate with Metahub to implement NFT listing & renting functionality.

## Installation

This package requires [ethers.js](https://github.com/ethers-io/ethers.js) peer dependency, so it needs to be installed too.

```bash
yarn add @iqprotocol/iq-space-sdk-js ethers
```

## Usage

Start with `IQSpace` client initialization. Then you can use the client to resolve adapters for various contracts.

### IQSpace

The architecture consists of the main entrypoint, which we call `IQSpace`. To be able to interact with the rest of the SDK, one needs to instantiate the `IQSpace` instance.

#### Initialization

You need to provide a [Signer](https://docs.ethers.io/v5/api/signer/#Signer) which suits your use-case. For example, `VoidSigner` will be enough for reading data, but for listing, renting and other state-changing operations you need a signer, with private key.

```ts
import { IQSpace } from '@iqprotocol/iq-space-sdk-js';
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('<RPC URL>');
const accountAddress = '0x...';

const iqSpace = await IQSpace.init({
  signer: new VoidSigner(accountAddress, provider),
});
```

After the IQSpace has been instantiated, it can be used to resolve other crucial adapters of the SDK.

#### Chain ID

Since IQ Protocol SDK is made to be used for interacting with contracts deployed on various blockchains, it is crucial to make sure the correct contract addresses and asset identifiers are used. Therefor the SDK relies on [CAIP](https://www.npmjs.com/package/caip) standard identifiers for referencing accounts and assets. Often you will need to know the chain ID to construct such identifiers.

```ts
const chainId = await iqSpace.getChainId();
```

### Universe (IQVerse)

In order to create and manage your IQVerse you will need to use `UniverseWizardAdapter` (can have multiple versions) and `UniverseRegistryAdapter`.

```ts
import { AccountId, ChainId } from '@iqprotocol/iq-space-sdk-js';

const universeRegistryAddress = '0x...';
const universeRegistry = iqSpace.universeRegistry(
  new AccountId({
    chainId,
    address: universeRegistryAddress,
  }),
);

const universeWizardAddress = '0x...';
const universeWizard = iqSpace.universeWizardV1(
  new AccountId({
    chainId,
    address: universeWizardAddress,
  }),
);
```

#### Creation

A crucial part of the IQProtocol ecosystem is the ability to create and manage your own IQVerse. Each IQVerse has its own unique identifier, which is used to reference it in the universe registry. It is important for you to make sure that you do not _forget_ the universe ID.

```ts
const paymentTokenA = new AccountId({ chainId, address: '0x...' });
const paymentTokenB = new AccountId({ chainId, address: '0x...' });

// Create a new universe
const tx = await universeWizard.setupUniverse({
  name: 'My IQVerse',
  payemntTokens: [paymentTokenA, paymentTokenB],
});

// Retrieve the event that has encoded the universe ID
const universeInfo = await universeRegistry.findUniverseByCreationTransaction(tx.hash);

// Log the universe ID
const universeId = universeInfo!.id;
```

### Warper

In order to deploy a warper from a preset you will need to use the `WarperPresetFactoryAdapter`.

```ts
import { AccountId, ChainId } from '@iqprotocol/iq-space-sdk-js';

// Resolve WarperPresetFactoryAdapter.
const warperPresetFactoryAddress = '0x...';
const warperPresetFactory = iqSpace.warperPresetFactory(
  new AccountId({
    chainId,
    address: warperPresetFactoryAddress,
  }),
);
```

#### Warper preset deployment

The Preset Factory allows you to easily deploy warpers from presets. These presets are created and maintained by the
IQ Protocol team.

```ts
// Deploy ERC721ConfigurablePreset preset.
const presetId = 'ERC721ConfigurablePreset';
const metahubAddress = '0x...';
const originalAssetAddress = '0x...';

const tx = await warperPresetFactory.deployPreset(presetId, {
  metahub: new AccountId({
    chainId,
    address: metahubAddress,
  }),
  original: new AssetType({
    chainId,
    assetName: {
      namespace: 'erc721',
      reference: originalAssetAddress,
    },
  }),
});

// Wait for TX confirmation.
await tx.wait();

// Find out the deployed warper reference.
const warperAssetType = await warperPresetFactory.findWarperByDeploymentTransaction(tx);
const warperAddress = warperAssetType!.assetName.reference;
```

### Warper Manager

In order to manage your warpers, you will need to use `WarperWizardAdapter` (can have multiple versions) and `WarperManagerAdapter`.

```ts
import { AccountId, ChainId } from '@iqprotocol/iq-space-sdk-js';

const warperWizardAddress = '0x...';
const warperWizard = iqSpace.warperWizardV1(
  new AccountId({
    chainId,
    address: warperWizardAddress,
  }),
);

const warperManagerAddress = '0x...';
const warperManager = iqSpace.warperManager(
  new AccountId({
    chainId,
    address: warperManagerAddress,
  }),
);
```

#### Custom Warper registration

Anyone can create a custom warper and register it with Warper Wizard.
Please refer to the code snippet below for more details for how to exactly register a custom warper.
The code snippet assumes that the custom Warper has already been deployed.

```ts
import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants'; // @todo: expose through SDK

const warperAddress = '0x...';
const warperAssetType = new AssetType({
  chainId,
  assetName: { namespace: 'erc721', reference: warperAddress },
});
const warperTaxTerms = '...'; // @todo: create and expose helper for this
const warperInitData = '...'; // @todo: create and expose helper for this
const warperParams = {
  name: 'My Warper',
  universeId: '<your universe ID>',
  paused: false,
};

await warperWizard.registerWarper(
  warperAssetType,
  warperTaxTerms,
  warperParams,
  WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET,
  warperInitData,
);
```

#### Pause Warper

To pause a warper, the warper, of course needs to be registered and NOT PAUSED.

```ts
const warperAddress = '0x0...';
await warperManager.pauseWarper(
  new AssetType({
    chainId,
    assetName: {
      namespace: 'erc721',
      reference: warperAddress,
    },
  }),
);
```

#### Unpause Warper

To unpause a warper, the warper, of course needs to be registered and PAUSED.

```ts
const warperAddress = '0x0...';
await warperManager.unpauseWarper(
  new AssetType({
    chainId,
    assetName: {
      namespace: 'erc721',
      reference: warperAddress,
    },
  }),
);
```

#### View warpers

```ts
// if the Warper is already known, we can use the `warper` method.
const warperAddress = '0x0...';
const warper = new AssetType({
  chainId,
  assetName: {
    namespace: 'erc721',
    reference: warperAddress,
  },
});
const registeredWarper = await warperManager.warper(warper);

// If we want to enumerate all warpers in universe and we know the original asset, we can use the `universeAssetWarpers` method.
const universeId = '<your universe ID>';
const originalAddress = '0x0...';
const originalAsset = new AssetType({
  chainId,
  assetName: {
    namespace: 'erc721',
    reference: originalAddress,
  },
});
const registeredWarpersForAsset = await warperManager.universeAssetWarpers(universeId, originalAsset, 0, 20);

// If we want to enumerate all warpers and we know the universe ID, we can use the `universeWarpers` method.
const registeredWarpersForUniverse = await warperManager.universeWarpers(universeId, 0, 20);
```

### Listing & Renting

In order to list and rent, you will need to use `MetahubAdapater`, `ListingManagerAdapter`, `RentingManagerAdapter` and `ListingWizardAdapter` (can have multiple versions).

```ts
import { AccountId, ChainId } from '@iqprotocol/iq-space-sdk-js';

const metahub = iqSpace.metahub(
  new AccountId({
    chainId,
    address: '0x...',
  }),
);

const listingManager = iqSpace.listingManager(
  new AccountId({
    chainId,
    address: '0x...',
  }),
);

const rentingManager = iqSpace.rentingManager(
  new AccountId({
    chainId,
    address: '0x...',
  }),
);

const listingWizard = iqSpace.listingWizardV1(
  new AccountId({
    chainId,
    address: '0x...',
  }),
);
```

#### List asset

To list an asset for rent, there must be at least one IQVerse with a registered Warper for the given Original:

```ts
import { BigNumber } from 'ethers';

const universeId = '<your universe ID>';
const originalAssetAddress = '0x0...';

// Encode the asset
const asset = {
  id: new AssetId({
    chainId,
    assetName: {
      namespace: 'erc721',
      reference: originalAssetAddress,
    },
    tokenId: '42',
  }),
  // The amount of tokens. For ERC721 this is always 1. For other token standards - it may differ.
  value: 1,
};

// Allow Metahub to take custody of the asset
const approvalTx = await metahub.approveForListing(asset);
await approvalTx.wait();

// List the token
const assetListingParams = {
  assets: [asset],
  params: {
    lister: new AccountId({ chainId, address: '0x...' })
    configurator: new AccountId({ chainId, address: '0x...' })
  },
  // The maximum amount of time the asset owner can wait before getting the asset back.
  maxLockPeriod: BigNumber.from(99604800),
  // Whether or not the lister will receive the funds immediately on rent, or
  // will let the funds accumulate on the protocol before withdrawing them.
  immediatePayout: true,
};
const listingTerms = {} // @todo: expose helper
const tx = await listingWizard.createListingWithTerms({
  universeId,
  assetListingParams,
  listingTerms
});
console.log(`Tx ${tx.hash}`);
```

#### View listings

After an asset has been listed, you can view the listings of the asset.

```ts
// If we know the ID of a listing, we can retrieve the whole Listing structure
const listing = await listingManager.listing(15);

// If we want to enumerate ALL listings, then we can use the `listings` method to paginate it.
// The following code will fetch the first 20 listings.
const listings = await listingManager.listings(0, 20);

// If we want to see all listings for a specific user, we can use the `userListings` method.
// The following code will fetch the 20 listings with an offset of 5 initial ones for the given user.
const listerAddress = '0x0...';
const userListings = await listingManager.userListings(
  new AccountId({
    chainId,
    address: listerAddress,
  }),
  5,
  20,
);

// If we want to see all listings for a specific asset, we can use the `listingsForAsset` method.
// The following code will fetch the 20 listings with an offset of 4 initial ones for the given asset.
const originalAssetAddress = '0x0...';
const assetListings = await listingManager.assetListings(
  new AssetType({
    chainId,
    assetName: {
      namespace: 'erc721',
      reference: originalAssetAddress,
    },
  }),
  4,
  20,
);
```

#### Delist asset

To be able to delist an asset, we need to know the listing ID beforehand.

```ts
const listingId = 15;
await listingManager.disableListing(listingId);
```

#### Withdraw asset

To be able to withdraw an asset, we need to know the listing ID beforehand, and the asset needs to be delisted beforehand.

```ts
const listingId = 15;
await metahub.withdrawListingAssets(listingId);
```

#### Rent

```ts
// Retrieve the base token used as a rent payment.
const baseToken = await metahub.baseToken();

// Set listing ID and listing terms ID
const listingId = 15; // Assume that this is the listing ID of the asset we want to rent.
const listingTermsId = 99; // Assume that this is the listing terms ID of the listing.

// Prepare asset types and account structures.
const renterAddress = '0x0...';
const renter = new AccountId({ chainId, address: renterAddress });

const warperAddress = '0x0...';
const warperAsset = new AssetType({
  chainId,
  assetName: {
    namespace: 'erc721',
    reference: warperAddress,
  },
});

// Estimate rental costs.
const rentalParams = {
  warper: warperAsset,
  renter,
  paymentToken: baseToken.type,
  listingId,
  rentalPeriod: 3600 * 3, // 3 hours
  listingTermsId,
  selectedConfiguratorListingTerms: {}, // @todo: ?
};
const estimation = await rentingManager.estimateRent(rentalParams);

// Perform the actual rental
tx = await rentingManager.rent({ ...rentalParams, maxPaymentAmount: estimation.total }); // @todo: token quote?

// Wait for the rental transaction to succeed
await tx.wait();
```

#### View rentals

```ts
// To get an individual rental, we can use the `rentalAgreement` method.
// The rental Id needs to be known beforehand.
const rentalId = 15;
const rentalAgreement = await rentingManager.rentalAgreement(rentalId);

// To get all rentals for a specific user, we can use the `userRentalAgreements` method.
// The function takes an account ID and an offset and a limit to paginate the results.
const renterAddress = '0x0...';
const renter = new AccountId({ chainId, address: renterAddress });
const userRentalAgreement = await rentingManager.userRentalAgreements(renter, 0, 20);
```

#### Get accumulated user balance

```ts
const userAddress = '0x0...';
const user = new AccountId({ chainId, address: userAddress });
const baseToken = await metahub.baseToken();

// Get accumulated user balance for a single token.
const userBalance = await metahub.balance(user, baseToken.type);
// Get accumulated user balance for all tokens.
const userBalances = await metahub.balances(user);
```

#### Get accumulated universe balance

```ts
const universeId = 1;
const baseToken = await metahub.baseToken();

// Get accumulated universe balance for a single token.
const universeBalance = await metahub.universeBalance(universeId, baseToken.type);
// Get accumulated universe balance for all tokens.
const universeBalances = await metahub.universeBalances(universeId);
```

#### Withdraw user earnings

Withdrawing funds is only possible if the user has earned some, and the listing DID NOT specify `immediatePayout` (meaning that funds had accumulated on the actual contract).

```ts
// the token we want to withdraw
const baseToken = await metahub.baseToken();

// The amount we want to withdraw
const amount = 100;

// The account we want to withdraw TO
const toAddress = '0x0...';
const to = new AccountId({ chainId, address: toAddress });

// Perform the withdrawal
await metahub.withdrawFunds(baseToken.type, amount, to);
```

#### Withdraw universe earnings

When rentals happen in a given universe, part of the rental fee actually goes to the said IQVerse.

```ts
// Assume we know the universe ID.
const universeId = 1;

// the token we want to withdraw
const baseToken = await metahub.baseToken();

// The amount we want to withdraw
const amount = 100;

// The account we want to withdraw TO
const toAddress = '0x0...';
const to = new AccountId({ chainId, address: toAddress });

// Perform the withdrawal
await metahub.withdrawUniverseFunds(universeId, baseToken.type, amount, to);
```
