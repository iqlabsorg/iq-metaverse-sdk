import { BigNumberish } from '@ethersproject/bignumber';
import { IListingTermsRegistry, ITokenQuote } from '@iqprotocol/iq-space-protocol-light/typechain';
import { Listings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/listing/listing-configurator/AbstractListingConfigurator';
import { Accounts } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { Rentings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/renting/renting-manager/IRentingManager';
import { Warpers } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/warper/IWarperController';
import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { BigNumber, BytesLike, Overrides as BaseOverrides, Signer } from 'ethers';

export type Address = string;

export type SignerData = {
  signer: Signer;
  address: string;
  accountId: AccountId;
};

export type DelegatedSignature = {
  signature: string;
  signatureEncodedForProtocol: BytesLike;
  v: number;
  r: string;
  s: string;
};

export type DelegatedSignatureWithNonce = {
  delegatedSignature: DelegatedSignature;
  nonce: BigNumber;
};

export type Overrides = BaseOverrides & { from?: string | Promise<string> };

export type IQSpaceParams = {
  signer: Signer;
};

export interface ChainAware {
  // https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
  getChainId(): Promise<ChainId>;
}

export type ListingTermsInfo = IListingTermsRegistry.ListingTermsStruct & {
  id: BigNumber;
};

export type ListingTermsQueryParams = {
  listingId: BigNumberish;
  universeId: BigNumberish;
  warper: AssetType;
};

export type ListingTermsInfoWithParams = ListingTermsInfo & ListingTermsQueryParams;

export type TaxTermsQueryParams = {
  taxStrategyId: BytesLike;
  universeId: BigNumberish;
  warper: AssetType;
};

export type AssetListingParams = {
  assets: Asset[];
  params: {
    lister: AccountId;
    configurator: AccountId;
  };
  maxLockPeriod: BigNumberish;
  immediatePayout: boolean;
};

export type Listing = Pick<
  Listings.ListingStructOutput,
  'maxLockPeriod' | 'lockedTill' | 'immediatePayout' | 'enabled' | 'paused'
> & {
  id: BigNumber;
  assets: Asset[];
  configurator: AccountId;
  beneficiary: AccountId;
  lister: AccountId;
};

export type ListingParams = {
  universeId: BigNumberish;
  assetListingParams: AssetListingParams;
  listingTerms: IListingTermsRegistry.ListingTermsStruct;
  delegatedListingSignature?: BytesLike;
};

export type AssetNamespace = 'erc20' | 'erc721' | 'erc1155';

export type Asset = {
  id: AssetId;
  value: BigNumberish;
};

export type RegisteredWarper = Pick<Warpers.WarperStructOutput, 'name' | 'universeId' | 'paused'> & {
  self: AssetType;
  original: AssetType;
};

export type RentingEstimationParams = Pick<Rentings.ParamsStruct, 'listingId' | 'rentalPeriod' | 'listingTermsId'> & {
  warper: AssetType;
  renter: AccountId;
  paymentToken: AssetType;
  selectedConfiguratorListingTerms?: IListingTermsRegistry.ListingTermsStruct;
};

export type RentingParams = RentingEstimationParams & {
  maxPaymentAmount: BigNumberish;
  tokenQuote?: BytesLike;
  tokenQuoteSignature?: BytesLike;
};

export type RentalFees = Pick<
  Rentings.RentalFeesStructOutput,
  'total' | 'protocolFee' | 'listerBaseFee' | 'listerPremium' | 'universeBaseFee' | 'universePremium'
>;

export type RentalAgreement = Pick<
  Rentings.AgreementStructOutput,
  'universeId' | 'collectionId' | 'listingId' | 'startTime' | 'endTime'
> & {
  id: BigNumber;
  warpedAssets: Asset[];
  renter: AccountId;
  agreementTerms: AgreementTerms;
};

export enum RentalStatusEnum {
  NONE,
  AVAILABLE,
  RENTED,
}

export type RentalStatus = 'none' | 'available' | 'rented';

export type PaymentTokenData = Pick<ITokenQuote.PaymentTokenDataStruct, 'paymentTokenQuote'> & {
  paymentToken: AccountId;
};

export type AgreementTerms = Pick<
  Rentings.AgreementTermsStruct,
  'listingTerms' | 'universeTaxTerms' | 'protocolTaxTerms'
> & {
  paymentTokenData: PaymentTokenData;
};

export type AccountBalance = Pick<Accounts.BalanceStructOutput, 'amount'> & {
  token: AssetType;
};

export type BaseToken = {
  type: AssetType;
  name: string;
  symbol: string;
  decimals: number;
};

export type WarperRentingConstraints = {
  availabilityPeriod?: {
    start: number;
    end: number;
  };
  rentalPeriod?: {
    min: number;
    max: number;
  };
};

export type UniverseParams = {
  name: string;
  paymentTokens: AccountId[];
};

export type UniverseInfo = {
  id: BigNumber;
  name: string;
  paymentTokens: AccountId[];
};

export type WarperPreset = {
  id: BytesLike;
  implementation: AccountId;
  enabled: boolean;
};

export type AssetClassConfig = {
  vault: AccountId;
  controller: AccountId;
};

export type ListingStrategyConfig = {
  controller: AccountId;
  taxStrategyId: BytesLike;
};

export type ListingConfiguratorPreset = {
  id: BytesLike;
  implementation: AccountId;
  enabled: boolean;
};

export type TaxStrategyConfig = {
  controller: AccountId;
};

export type ListingExtendedDelegatedSignatureData = {
  universeId: BigNumberish;
  assetListingParams: AssetListingParams;
  listingTerms: IListingTermsRegistry.ListingTermsStruct;
  salt: string;
};

export type ListingExtendedDelegatedSignatureVerificationData = ListingExtendedDelegatedSignatureData & {
  delegatedSignatureWithNonce: DelegatedSignatureWithNonce;
};

export type RentingExtendedDelegatedSignatureData = {
  params: RentingParams;
  salt: string;
};

export type RentingExtendedDelegatedSignatureVerificationData = RentingExtendedDelegatedSignatureData & {
  delegatedSignatureWithNonce: DelegatedSignatureWithNonce;
};

export type ListingBatchData = {
  multiCall: string[];
  singleCall?: ListingParams;
};
