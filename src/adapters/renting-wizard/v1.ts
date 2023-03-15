import { TypedDataSigner } from '@ethersproject/abstract-signer';
import {
  buildDelegatedRentDataV1,
  buildDelegatedRentPrimaryTypeV1,
  buildExtendedDelegatedRentDataV1,
  buildExtendedDelegatedRentPrimaryTypeV1,
  prepareTypedDataActionEip712SignatureV1,
  verifyTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol-light';
import { RentingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { BigNumber, BytesLike } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { RentingHelper } from '../../helpers';
import {
  DelegatedSignature,
  DelegatedSignatureWithNonce,
  RentingExtendedDelegatedSignatureData,
  RentingParams,
} from '../../types';

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
   * Create delegated renting ABI encoded (v,r,s)(uint8, bytes32, bytes32) typed data signature (EIP712).
   * Caller should be the actual renter.
   * @param nonce Nonce (optional).
   */
  async createDelegatedRentSignature(nonce?: BigNumber): Promise<DelegatedSignatureWithNonce> {
    const signerData = await this.signerData();

    const delegatedRentingCurrentNonce = nonce ?? (await this.getDelegatedRentCurrentNonce(signerData.accountId));
    const delegatedSignature = await prepareTypedDataActionEip712SignatureV1(
      buildDelegatedRentDataV1(delegatedRentingCurrentNonce),
      buildDelegatedRentPrimaryTypeV1(),
      signerData.signer as unknown as TypedDataSigner,
      signerData.accountId.chainId.reference,
      this.contract.address,
    );

    return {
      nonce: delegatedRentingCurrentNonce,
      delegatedSignature,
    };
  }

  /**
   * Create extended delegated renting ABI encoded (v,r,s)(uint8, bytes32, bytes32) typed data signature (EIP712).
   * Caller should be the actual renter.
   * @param dataToSign Data to sign.
   */
  async createExtendedDelegatedRentSignature(
    dataToSign: RentingExtendedDelegatedSignatureData,
  ): Promise<DelegatedSignature> {
    const signerData = await this.signerData();

    const delegatedSignatureWithNonce =
      dataToSign.delegatedSignatureWithNonce ?? (await this.createDelegatedRentSignature());

    const { rentingParams, tokenQuote, tokenQuoteSignature, maxPaymentAmount } =
      RentingHelper.prepareExtendedRentingParams(dataToSign.params, this.addressTranslator);

    return prepareTypedDataActionEip712SignatureV1(
      buildExtendedDelegatedRentDataV1(
        dataToSign.salt,
        delegatedSignatureWithNonce.nonce,
        rentingParams,
        tokenQuote,
        tokenQuoteSignature,
        maxPaymentAmount,
        delegatedSignatureWithNonce.delegatedSignature.signatureEncodedForProtocol,
      ),
      buildExtendedDelegatedRentPrimaryTypeV1(),
      signerData.signer as unknown as TypedDataSigner,
      signerData.accountId.chainId.reference,
      this.contract.address,
    );
  }

  /**
   * Verify delegated renting signature.
   * @param signature Typed data signature (EIP712).
   * @returns True if signature is valid.
   */
  async verifyDelegatedRentSignature(signature: BytesLike, nonce?: BigNumber): Promise<boolean> {
    const signerData = await this.signerData();
    const delegatedListingCurrentNonce = nonce ?? (await this.getDelegatedRentCurrentNonce(signerData.accountId));

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signerData.accountId.chainId.reference,
      buildDelegatedRentDataV1(delegatedListingCurrentNonce),
      buildDelegatedRentPrimaryTypeV1(),
      signature,
    );

    return address === signerData.address;
  }

  /**
   * Verify extended delegated renting signature.
   * @param signatureData Signature data.
   * @param signature Typed data signature (EIP712).
   * @returns True if signature is valid.
   */
  async verifyExtendedDelegatedRentSignature(
    signatureData: RentingExtendedDelegatedSignatureData,
    signature: BytesLike,
  ): Promise<boolean> {
    const signerData = await this.signerData();

    const delegatedSignatureWithNonce =
      signatureData.delegatedSignatureWithNonce ?? (await this.createDelegatedRentSignature());

    const { rentingParams, tokenQuote, tokenQuoteSignature, maxPaymentAmount } =
      RentingHelper.prepareExtendedRentingParams(signatureData.params, this.addressTranslator);

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signerData.accountId.chainId.reference,
      buildExtendedDelegatedRentDataV1(
        signatureData.salt,
        delegatedSignatureWithNonce.nonce,
        rentingParams,
        tokenQuote,
        tokenQuoteSignature,
        maxPaymentAmount,
        delegatedSignatureWithNonce.delegatedSignature.signatureEncodedForProtocol,
      ),
      buildExtendedDelegatedRentPrimaryTypeV1(),
      signature,
    );

    return address === signerData.address;
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
