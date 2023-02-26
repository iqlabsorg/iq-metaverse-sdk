import { AccountId, AssetType } from 'caip';
import { BytesLike, constants, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { ITaxTermsRegistry, IWarperManager, WarperWizardV1 } from '../../contracts';
import {
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol/src/utils/bytes-and-hashing';

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
   */
  async registerExistingWarper(
    warper: AssetType,
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
    registrationParams: IWarperManager.WarperRegistrationParamsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.registerWarper(
      this.assetTypeToAddress(warper),
      taxTerms,
      registrationParams,
      EMPTY_BYTES32_DATA_HEX,
      EMPTY_BYTES_DATA_HEX,
    );
  }

  /**
   * Creates and registers a new warper from a preset.
   * @param taxTerms Warper tax terms.
   * @param registrationParams Warper registration params.
   * @param presetId Name of the warper preset ID.
   * @param initData Warper init data.
   */
  async createWarperFromPresetAndRegister(
    taxTerms: ITaxTermsRegistry.TaxTermsStruct,
    registrationParams: IWarperManager.WarperRegistrationParamsStruct,
    presetId: BytesLike,
    initData: BytesLike,
  ): Promise<ContractTransaction> {
    return this.contract.registerWarper(constants.AddressZero, taxTerms, registrationParams, presetId, initData);
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
  async alterWarperTaxTerms(
    warper: AssetType,
    newTaxTermsParams: ITaxTermsRegistry.TaxTermsStruct,
  ): Promise<ContractTransaction> {
    return this.contract.alterWarperTaxTerms(this.assetTypeToAddress(warper), newTaxTermsParams);
  }
}
