import { RentingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { BigNumber, BytesLike } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { RentingHelper } from '../../helpers';
import { RentingParams } from '../../types';

export class RentingWizardAdapterV1 extends Adapter {
  private readonly contract: RentingWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveRentingWizardV1(accountId.address);
  }

  /**
   * Performs renting operation (delegated).
   * @param params Renting parameters.
   * @param delegatedRentingSignature Delegated Renting ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   */
  async delegatedRent(params: RentingParams, delegatedRentingSignature: BytesLike) {
    const { rentingParams, tokenQuote, tokenQuoteSignature, maxPaymentAmount } =
      RentingHelper.prepareExtendedRentingParams(params, this.addressTranslator);
    return this.contract.delegatedRent(
      rentingParams,
      tokenQuote,
      tokenQuoteSignature,
      maxPaymentAmount,
      delegatedRentingSignature,
    );
  }

  /**
   * Get the current nonce of renter for delegated rent.
   * @param renter Renter account ID.
   */
  async getDelegatedRentCurrentNonce(renter: AccountId): Promise<BigNumber> {
    return this.contract.getDelegatedRentCurrentNonce(this.accountIdToAddress(renter));
  }

  /**
   * Returns the domain separator used in the encoding of the signature for permit, as defined by EIP712.
   */
  async DOMAIN_SEPARATOR(): Promise<string> {
    return this.contract.DOMAIN_SEPARATOR();
  }
}
