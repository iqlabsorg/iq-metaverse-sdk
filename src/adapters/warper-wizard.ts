import { AccountId, AssetType } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { WarperWizard } from '../contracts';
import { TaxTerms, WarperRegistrationParams } from '../types';

export class WarperWizardAdapter extends Adapter {
  private readonly contract: WarperWizard;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperWizard(accountId.address);
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
    taxTerms: TaxTerms,
    registrationParams: WarperRegistrationParams,
    presetId: BytesLike,
    initData: BytesLike,
  ): Promise<ContractTransaction> {
    return this.contract.registerWarper(
      this.assetTypeToAddress(warper),
      taxTerms,
      registrationParams,
      presetId,
      initData,
    );
  }
}
