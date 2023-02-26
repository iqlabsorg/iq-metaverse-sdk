import {
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol-light/src/utils/bytes-and-hashing';
import { AccountId, AssetType } from 'caip';
import { BytesLike, constants, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { ITaxTermsRegistry, IUniverseRegistry, IWarperManager, UniverseWizardV1 } from '../../contracts';
import { UniverseParams } from '../../types';

export class UniverseWizardAdapterV1 extends Adapter {
  private readonly contract: UniverseWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveUniverseWizardV1(accountId.address);
  }

  /**
   * Creates new Universe. This includes minting new universe NFT, where the caller of this method becomes the
   * universe owner.
   * @param params The universe properties & initial configuration params.
   */
  async setupUniverse(universeParams: UniverseParams): Promise<ContractTransaction> {
    const params: IUniverseRegistry.UniverseParamsStruct = {
      name: universeParams.name,
      paymentTokens: universeParams.paymentTokens.map(x => this.accountIdToAddress(x)),
    };
    return this.contract.setupUniverse(params);
  }

  /**
   * Creates a new Universe, deploys and registers a new Warper.
   * @param universeParams The universe properties & initial configuration params.
   * @param warperTaxTerms Warper tax terms.
   * @param warperRegistrationParams Warper registration params.
   * @param warperPresetId Warper preset ID.
   * @param warperInitData Warper init data.
   */
  async setupUniverseAndCreateWarperFromPresetAndRegister(
    universeParams: UniverseParams,
    warperTaxTerms: ITaxTermsRegistry.TaxTermsStruct,
    warperRegistrationParams: IWarperManager.WarperRegistrationParamsStruct,
    warperPresetId: BytesLike,
    warperInitData: BytesLike,
  ): Promise<ContractTransaction> {
    const params: IUniverseRegistry.UniverseParamsStruct = {
      name: universeParams.name,
      paymentTokens: universeParams.paymentTokens.map(x => this.accountIdToAddress(x)),
    };
    return this.contract.setupUniverseAndWarper(
      params,
      warperTaxTerms,
      constants.AddressZero,
      warperRegistrationParams,
      warperPresetId,
      warperInitData,
    );
  }

  /**
   * Creates new Universe and registers existing Warper.
   * @param universeParams The universe properties & initial configuration params.
   * @param warper Warper reference.
   * @param warperTaxTerms Warper tax terms.
   * @param warperRegistrationParams Warper registration params.
   */
  async setupUniverseAndRegisterExistingWarper(
    universeParams: UniverseParams,
    warper: AssetType,
    warperTaxTerms: ITaxTermsRegistry.TaxTermsStruct,
    warperRegistrationParams: IWarperManager.WarperRegistrationParamsStruct,
  ): Promise<ContractTransaction> {
    const params: IUniverseRegistry.UniverseParamsStruct = {
      name: universeParams.name,
      paymentTokens: universeParams.paymentTokens.map(x => this.accountIdToAddress(x)),
    };
    return this.contract.setupUniverseAndWarper(
      params,
      warperTaxTerms,
      this.assetTypeToAddress(warper),
      warperRegistrationParams,
      EMPTY_BYTES32_DATA_HEX,
      EMPTY_BYTES_DATA_HEX,
    );
  }
}
