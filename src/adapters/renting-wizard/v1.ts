import { TypedDataSigner } from '@ethersproject/abstract-signer';
import {
  buildDelegatedRentDataV1,
  buildDelegatedRentPrimaryTypeV1,
  prepareTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol-light';
import { RentingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { BigNumber, BytesLike } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { RentingHelper } from '../../helpers';
import { DelegatedSignature, RentingParams } from '../../types';

export class RentingWizardAdapterV1 extends Adapter {
  private readonly contract: RentingWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveRentingWizardV1(accountId.address);
  }

  /**
   * Performs renting operation (delegated).
   * @param params Renting parameters.
   * @param delegatedRentSignature Delegated Rent ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   */
  async delegatedRent(params: RentingParams, delegatedRentSignature: BytesLike) {
    const { rentingParams, tokenQuote, tokenQuoteSignature, maxPaymentAmount } =
      RentingHelper.prepareExtendedRentingParams(params, this.addressTranslator);
    return this.contract.delegatedRent(
      rentingParams,
      tokenQuote,
      tokenQuoteSignature,
      maxPaymentAmount,
      delegatedRentSignature,
    );
  }

  /**
   * Create delegated renting ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   * Caller should be the actual renter.
   */
  async createDelegatedRentSignature(): Promise<DelegatedSignature> {
    const signerData = await this.signerData();
    const delegatedRentingCurrentNonce = await this.getDelegatedRentCurrentNonce(signerData.accountId);
    return prepareTypedDataActionEip712SignatureV1(
      buildDelegatedRentDataV1(delegatedRentingCurrentNonce),
      buildDelegatedRentPrimaryTypeV1(),
      signerData.signer as unknown as TypedDataSigner,
      signerData.accountId.chainId.reference,
      this.contract.address,
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
