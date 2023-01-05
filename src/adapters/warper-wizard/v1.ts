import { AccountId, AssetType } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { WarperWizardV1 } from '../../contracts';
import { TaxTermsParams, WarperRegistrationParams } from '../../types';

export class WarperWizardAdapterV1 extends Adapter {
  private readonly contract: WarperWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperWizardV1(accountId.address);
  }

  /**
   * Registers a new warper.
   * The warper must be deployed and configured prior to registration, since it becomes available for renting immediately.
   * @param warper Warper reference.
   * @param taxTerms Warper tax terms.
   * @param registrationParams Warper registration params.
   * @param presetId Warper preset ID.
   * @param initData Warper init data.
   */
  async registerWarper(
    warper: AssetType,
    taxTerms: TaxTermsParams,
    registrationParams: WarperRegistrationParams,
    presetId: BytesLike,
    initData: BytesLike,
  ): Promise<ContractTransaction> {
    return this.contract.registerWarper(
      this.assetTypeToAddress(warper),
      this.encodeTaxTermsParams(taxTerms),
      registrationParams,
      presetId,
      initData,
    );
  }

  /**
   * Deletes warper registration information.
   * All current rental agreements with the warper will stay intact, but the new rentals won't be possible.
   * @param warper Warper reference.
   */
  async deregisterWarper(warper: AssetType): Promise<ContractTransaction> {
    return this.contract.deregisterWarper(this.assetTypeToAddress(warper));
  }

  /**
   * Change warper tax terms.
   * @param warper Warper reference.
   * @param newTaxTermsParams New warper tax terms params.
   */
  async alterWarperTaxTerms(warper: AssetType, newTaxTermsParams: TaxTermsParams): Promise<ContractTransaction> {
    return this.contract.alterWarperTaxTerms(
      this.assetTypeToAddress(warper),
      this.encodeTaxTermsParams(newTaxTermsParams),
    );
  }
}
