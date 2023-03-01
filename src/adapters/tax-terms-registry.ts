import { ITaxTermsRegistry, TaxTermsRegistry } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId, AssetType } from 'caip';
import { BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { TaxTermsQueryParams } from '../types';

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
  async universeTaxTerms(queryParams: TaxTermsQueryParams): Promise<ITaxTermsRegistry.TaxTermsStructOutput> {
    const encodedParams = this.encodeTaxTermsQueryParams(queryParams);
    return this.contract.universeTaxTerms(encodedParams);
  }

  /**
   * Returns protocol's tax terms.
   * @param queryParams Query parameters.
   */
  async protocolTaxTerms(queryParams: TaxTermsQueryParams): Promise<ITaxTermsRegistry.TaxTermsStructOutput> {
    const encodedParams = this.encodeTaxTermsQueryParams(queryParams);
    return this.contract.protocolTaxTerms(encodedParams);
  }

  /**
   * Registers universe local tax terms.
   * @param universeId Universe ID.
   * @param taxTerms Tax terms.
   */
  async registerUniverseLocalTaxTerms(
    universeId: BigNumberish,
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerUniverseLocalTaxTerms(universeId, taxTerms);
  }

  /**
   * Removes universe local tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyId Tax strategy ID.
   */
  async removeUniverseLocalTaxTerms(universeId: BigNumberish, taxStrategyId: BytesLike): Promise<ContractTransaction> {
    return this.contract.removeUniverseLocalTaxTerms(universeId, taxStrategyId);
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
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerUniverseWarperTaxTerms(universeId, this.assetTypeToAddress(warper), taxTerms);
  }

  /**
   * Removes universe warper tax terms.
   * @param universeId Universe ID.
   * @param warper Warper reference.
   * @param taxStrategyId Tax strategy ID.
   */
  async removeUniverseWarperTaxTerms(
    universeId: BigNumberish,
    warper: AssetType,
    taxStrategyId: BytesLike,
  ): Promise<ContractTransaction> {
    return this.contract.removeUniverseWarperTaxTerms(universeId, this.assetTypeToAddress(warper), taxStrategyId);
  }

  /**
   * Registers protocol global tax terms.
   * @param taxTerms Tax terms.
   */
  async registerProtocolGlobalTaxTerms(taxTerms: ITaxTermsRegistry.TaxTermsStruct): Promise<ContractTransaction> {
    return this.contract.registerProtocolGlobalTaxTerms(taxTerms);
  }

  /**
   * Removes protocol global tax terms.
   * @param taxStrategyId Tax strategy ID.
   */
  async removeProtocolGlobalTaxTerms(taxStrategyId: BytesLike): Promise<ContractTransaction> {
    return this.contract.removeProtocolGlobalTaxTerms(taxStrategyId);
  }

  /**
   * Registers protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxTerms Tax terms.
   */
  async registerProtocolUniverseTaxTerms(
    universeId: BigNumberish,
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerProtocolUniverseTaxTerms(universeId, taxTerms);
  }

  /**
   * Removes protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyId Tax strategy ID.
   */
  async removeProtocolUniverseTaxTerms(
    universeId: BigNumberish,
    taxStrategyId: BytesLike,
  ): Promise<ContractTransaction> {
    return this.contract.removeProtocolUniverseTaxTerms(universeId, taxStrategyId);
  }

  /**
   * Registers protocol warper tax terms.
   * @param warper Warper reference.
   * @param taxTerms Tax terms.
   */
  async registerProtocolWarperTaxTerms(
    warper: AssetType,
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerProtocolWarperTaxTerms(this.assetTypeToAddress(warper), taxTerms);
  }

  /**
   * Removes protocol warper tax terms.
   * @param warper Warper reference.
   * @param taxStrategyId Tax strategy ID.
   */
  async removeProtocolWarperTaxTerms(warper: AssetType, taxStrategyId: BytesLike): Promise<ContractTransaction> {
    return this.contract.removeProtocolWarperTaxTerms(this.assetTypeToAddress(warper), taxStrategyId);
  }

  /**
   * Checks registration of universe warper tax terms.
   * @param universeId Universe ID.
   * @param warper Warper reference.
   * @param taxStrategyId Tax strategy ID.
   */
  async areRegisteredUniverseWarperTaxTerms(
    universeId: BigNumberish,
    warper: AssetType,
    taxStrategyId: BytesLike,
  ): Promise<boolean> {
    return this.contract.areRegisteredUniverseWarperTaxTerms(
      universeId,
      this.assetTypeToAddress(warper),
      taxStrategyId,
    );
  }

  /**
   * Checks registration of universe local tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyId Tax strategy ID.
   */
  async areRegisteredUniverseLocalTaxTerms(universeId: BigNumberish, taxStrategyId: BytesLike): Promise<boolean> {
    return this.contract.areRegisteredUniverseLocalTaxTerms(universeId, taxStrategyId);
  }

  /**
   * Checks registration of protocol global tax terms.
   * @param taxStrategyId Tax strategy ID.
   */
  async areRegisteredProtocolGlobalTaxTerms(taxStrategyId: BytesLike): Promise<boolean> {
    return this.contract.areRegisteredProtocolGlobalTaxTerms(taxStrategyId);
  }

  /**
   * Checks registration of protocol universe tax terms.
   * @param universeId Universe ID.
   * @param taxStrategyId Tax strategy ID.
   */
  async areRegisteredProtocolUniverseTaxTerms(universeId: BigNumberish, taxStrategyId: BytesLike): Promise<boolean> {
    return this.contract.areRegisteredProtocolUniverseTaxTerms(universeId, taxStrategyId);
  }

  /**
   * Checks registration of global protocol warper tax terms.
   * @param warper Warper reference.
   * @param taxStrategyId Tax strategy ID.
   */
  async areRegisteredProtocolWarperTaxTerms(warper: AssetType, taxStrategyId: BytesLike): Promise<boolean> {
    return this.contract.areRegisteredProtocolWarperTaxTerms(this.assetTypeToAddress(warper), taxStrategyId);
  }

  private encodeTaxTermsQueryParams(queryParams: TaxTermsQueryParams): ITaxTermsRegistry.ParamsStruct {
    const { taxStrategyId, universeId, warper } = queryParams;
    return {
      taxStrategyId,
      universeId,
      warperAddress: this.assetTypeToAddress(warper),
    };
  }
}
