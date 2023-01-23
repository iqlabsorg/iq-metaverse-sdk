import { AccountId, AssetType } from 'caip';
import { BigNumberish, ContractTransaction } from 'ethers';
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

  /**
   * Registers universe local tax terms.
   * @param universeId Universe ID.
   * @param taxTerms Tax terms.
   */
  async registerUniverseLocalTaxTerms(universeId: BigNumberish, taxTerms: TaxTerms): Promise<ContractTransaction> {
    return this.contract.registerUniverseLocalTaxTerms(universeId, this.encodeTaxTerms(taxTerms));
  }

  /**
   * Removes universe local tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async removeUniverseLocalTaxTerms(
    universeId: BigNumberish,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<ContractTransaction> {
    return this.contract.removeUniverseLocalTaxTerms(universeId, this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Registers universe warper tax terms.
   * @param universeId Universe ID.
   * @param warper Warper reference.
   * @param taxTerms Tax terms.
   */
  async registerUniverseWarperTaxTerms(
    universeId: BigNumberish,
    warper: AssetType,
    taxTerms: TaxTerms,
  ): Promise<ContractTransaction> {
    return this.contract.registerUniverseWarperTaxTerms(
      universeId,
      this.assetTypeToAddress(warper),
      this.encodeTaxTerms(taxTerms),
    );
  }

  /**
   * Removes universe warper tax terms.
   * @param universeId Universe ID.
   * @param warper Warper reference.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async removeUniverseWarperTaxTerms(
    universeId: BigNumberish,
    warper: AssetType,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<ContractTransaction> {
    return this.contract.removeUniverseWarperTaxTerms(
      universeId,
      this.assetTypeToAddress(warper),
      this.encodeTaxStrategyId(taxStrategyIdName),
    );
  }

  /**
   * Registers protocol global tax terms.
   * @param taxTerms Tax terms.
   */
  async registerProtocolGlobalTaxTerms(taxTerms: TaxTerms): Promise<ContractTransaction> {
    return this.contract.registerProtocolGlobalTaxTerms(this.encodeTaxTerms(taxTerms));
  }

  /**
   * Removes protocol global tax terms.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async removeProtocolGlobalTaxTerms(taxStrategyIdName: TaxTermsStrategyIdName): Promise<ContractTransaction> {
    return this.contract.removeProtocolGlobalTaxTerms(this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Registers protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxTerms Tax terms.
   */
  async registerProtocolUniverseTaxTerms(universeId: BigNumberish, taxTerms: TaxTerms): Promise<ContractTransaction> {
    return this.contract.registerProtocolUniverseTaxTerms(universeId, this.encodeTaxTerms(taxTerms));
  }

  /**
   * Removes protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async removeProtocolUniverseTaxTerms(
    universeId: BigNumberish,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<ContractTransaction> {
    return this.contract.removeProtocolUniverseTaxTerms(universeId, this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Checks registration of universe warper tax terms.
   * @param universeId Universe ID.
   * @param warper Warper reference.
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
   * Checks registration of universe local tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async areRegisteredUniverseLocalTaxTerms(
    universeId: BigNumberish,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<boolean> {
    return this.contract.areRegisteredUniverseLocalTaxTerms(universeId, this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Checks registration of protocol global tax terms.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async areRegisteredProtocolGlobalTaxTerms(taxStrategyIdName: TaxTermsStrategyIdName): Promise<boolean> {
    return this.contract.areRegisteredProtocolGlobalTaxTerms(this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Checks registration of protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async areRegisteredProtocolUniverseTaxTerms(
    universeId: BigNumberish,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<boolean> {
    return this.contract.areRegisteredProtocolUniverseTaxTerms(universeId, this.encodeTaxStrategyId(taxStrategyIdName));
  }

  /**
   * Checks registration of global protocol warper tax terms.
   * @param warper Warper reference.
   * @param taxStrategyIdName Name of the tax strategy ID.
   */
  async areRegisteredProtocolWarperTaxTerms(
    warper: AssetType,
    taxStrategyIdName: TaxTermsStrategyIdName,
  ): Promise<boolean> {
    return this.contract.areRegisteredProtocolWarperTaxTerms(
      this.assetTypeToAddress(warper),
      this.encodeTaxStrategyId(taxStrategyIdName),
    );
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
