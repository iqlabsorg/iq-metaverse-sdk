import { BigNumberish } from '@ethersproject/bignumber';
import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { BigNumber, BytesLike, Overrides as BaseOverrides, Signer } from 'ethers';
import { IListingTermsRegistry } from './contracts';
import { Accounts, ITokenQuote, Listings, Rentings } from './contracts/contracts/metahub/core/IMetahub';
import { Warpers } from './contracts/contracts/warper/IWarperController';

export type Address = string;

export type Overrides = BaseOverrides & { from?: string | Promise<string> };

export type IQSpaceParams = {
  signer: Signer;
};

export interface ChainAware {
  // https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
  getChainId(): Promise<ChainId>;
}

export type ListingParams = {
  lister: AccountId;
  configurator: AccountId;
};

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
  params: ListingParams;
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
