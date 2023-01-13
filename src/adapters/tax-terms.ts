import { AccountId, AssetType } from 'caip';
import { BigNumberish } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ITaxTermsRegistry, TaxTermsRegistry } from '../contracts';
import { TaxTerms, TaxTermsQueryParams, TaxTermsStrategyIdName } from '../types';

export class TaxTermsRegistryAdapter extends Adapter {
  private readonly contract: TaxTermsRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveTaxTermsRegistry(accountId.address);
  }

  /**
   * Checks registration of universe warper tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async areRegisteredUniverseWarperTaxTerms(
    universeId: BigNumberish,
    warper: AssetType,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<boolean> {
    return this.contract.areRegisteredUniverseWarperTaxTerms(
      universeId,
      this.assetTypeToAddress(warper),
      this.encodeTaxStrategyId(taxStrategyIdName),
    );
  }

  /**
   * Returns universe's tax terms.
   * @param queryParams Query parameters.
   */
  async universeTaxTerms(queryParams: TaxTermsQueryParams): Promise<TaxTerms> {
    const encodedParams = this.encodeTaxTermsQueryParams(queryParams);
    const terms = await this.contract.universeTaxTerms(encodedParams);
    return this.decodeTaxTerms(terms);
  }

  /**
   * Returns protocol's tax terms.
   * @param queryParams Query parameters.
   */
  async protocolTaxTerms(queryParams: TaxTermsQueryParams): Promise<TaxTerms> {
    const encodedParams = this.encodeTaxTermsQueryParams(queryParams);
    const terms = await this.contract.protocolTaxTerms(encodedParams);
    return this.decodeTaxTerms(terms);
  }

  private encodeTaxTermsQueryParams(queryParams: TaxTermsQueryParams): ITaxTermsRegistry.ParamsStruct {
    const { taxStrategyIdName, universeId, warper } = queryParams;
    return {
      taxStrategyId: this.encodeTaxStrategyId(taxStrategyIdName),
      universeId,
      warperAddress: this.assetTypeToAddress(warper),
    };
  }
}
