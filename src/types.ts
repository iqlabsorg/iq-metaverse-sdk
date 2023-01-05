import { BigNumberish } from '@ethersproject/bignumber';
import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { BigNumber, BytesLike, Overrides as BaseOverrides } from 'ethers';
import { listingStrategies, taxStrategies } from './constants';
import { Warpers } from './contracts/contracts/warper/IWarperController';
import { Accounts, ITokenQuote, Listings, Rentings } from './contracts/contracts/metahub/core/IMetahub';

export type Address = string;

export type Overrides = BaseOverrides & { from?: string | Promise<string> };

export interface ChainAware {
  // https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
  getChainId(): Promise<ChainId>;
}

export type ListingTermsParams = FixedPriceListingTermsParams | FixedPriceWithRewardListingTermsParams;

export type ListingParams = {
  lister: AccountId;
  configurator: AccountId;
};

export type ListingTermsInfo = {
  id: BigNumber;
  strategyId: BytesLike;
  strategyData: BytesLike;
};

export type FixedPriceListingTermsParams = {
  name: typeof listingStrategies.FIXED_RATE.name;
  data: {
    pricePerSecondInEthers: string;
  };
};

export type FixedPriceWithRewardListingTermsParams = {
  name: typeof listingStrategies.FIXED_RATE_WITH_REWARD.name;
  data: {
    pricePerSecondInEthers: string;
    rewardRatePercent: string;
  };
};

export type FixedRateTaxTermsParams = {
  name: typeof taxStrategies.FIXED_RATE_TAX.name;
  data: {
    ratePercent: string;
  };
};

export type FixedRateWithRewardTaxTermsParams = {
  name: typeof taxStrategies.FIXED_RATE_TAX_WITH_REWARD.name;
  data: {
    ratePercent: string;
    rewardRatePercent: string;
  };
};

export type TaxTermsParams = FixedRateTaxTermsParams | FixedRateWithRewardTaxTermsParams;

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

export type Asset = {
  id: AssetId;
  value: BigNumberish;
};

export type RegisteredWarper = Pick<Warpers.WarperStructOutput, 'name' | 'universeId' | 'paused'> & {
  self: AssetType;
  original: AssetType;
};

export type RentingEstimationParams = Pick<
  Rentings.ParamsStruct,
  'listingId' | 'rentalPeriod' | 'listingTermsId' | 'selectedConfiguratorListingTerms'
> & {
  warper: AssetType;
  renter: AccountId;
  paymentToken: AssetType;
};

export type RentingParams = RentingEstimationParams & {
  maxPaymentAmount: BigNumberish;
  tokenQuote: BytesLike;
  tokenQuoteSignature: BytesLike;
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

export type WarperRegistrationParams = {
  name: string;
  universeId: BigNumberish;
  paused: boolean;
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

export type WarperPresetIds = 'ERC721ConfigurablePreset';

export type WarperPresetInitData = {
  metahub: AccountId;
  original: AssetType;
};
