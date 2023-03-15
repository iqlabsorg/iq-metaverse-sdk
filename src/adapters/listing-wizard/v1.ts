import { TypedDataSigner } from '@ethersproject/abstract-signer';
import {
  buildDelegatedListingDataV1,
  buildDelegatedListingPrimaryTypeV1,
  buildExtendedDelegatedListingDataV1,
  buildExtendedDelegatedListingPrimaryTypeV1,
  prepareTypedDataActionEip712SignatureV1,
  verifyTypedDataActionEip712SignatureV1,
} from '@iqprotocol/iq-space-protocol-light';
import { IListingTermsRegistry, ListingWizardV1 } from '@iqprotocol/iq-space-protocol-light/typechain';
import { Listings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/listing/listing-manager/ListingManager';
import { Assets } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { AccountId } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import {
  AssetListingParams,
  DelegatedSignature,
  DelegatedSignatureWithNonce,
  ListingExtendedDelegatedSignatureData,
} from '../../types';

export class ListingWizardAdapterV1 extends Adapter {
  private readonly contract: ListingWizardV1;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingWizardV1(accountId.address);
  }

  /**
   * Creates new asset listing.
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   */
  async createListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<ContractTransaction> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } =
      this.prepareListingParams(assetListingParams);

    return this.contract.createListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
    );
  }

  /**
   * Creates new asset listing (delegated).
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   * @param delegatedListingSignature Delegated Listing ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   */
  async delegatedCreateListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
    delegatedListingSignature: BytesLike,
  ): Promise<ContractTransaction> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } =
      this.prepareListingParams(assetListingParams);

    return this.contract.delegatedCreateListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
      delegatedListingSignature,
    );
  }

  /**
   * Get the current nonce of lister for delegated listing.
   * @param lister Lister account ID.
   */
  async getDelegatedListingCurrentNonce(lister: AccountId): Promise<BigNumber> {
    return this.contract.getDelegatedListingCurrentNonce(this.accountIdToAddress(lister));
  }

  /**
   * Returns the domain separator used in the encoding of the signature for permit, as defined by EIP712.
   */
  async DOMAIN_SEPARATOR(): Promise<string> {
    return this.contract.DOMAIN_SEPARATOR();
  }

  /**
   * Create delegated listing ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   * Caller should be the actual lister.
   * @param nonce Nonce (optional).
   */
  async createDelegatedListingSignature(nonce?: BigNumber): Promise<DelegatedSignatureWithNonce> {
    const signerData = await this.signerData();

    const delegatedListingCurrentNonce = nonce ?? (await this.getDelegatedListingCurrentNonce(signerData.accountId));
    const delegatedSignature = await prepareTypedDataActionEip712SignatureV1(
      buildDelegatedListingDataV1(delegatedListingCurrentNonce),
      buildDelegatedListingPrimaryTypeV1(),
      signerData.signer as unknown as TypedDataSigner,
      signerData.accountId.chainId.reference,
      this.contract.address,
    );

    return {
      nonce: delegatedListingCurrentNonce,
      delegatedSignature,
    };
  }

  /**
   * Create extended delegated listing ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   * Caller should be the actual lister.
   * @param dataToSign Data to sign.
   */
  async createExtendedDelegatedListingSignature(
    dataToSign: ListingExtendedDelegatedSignatureData,
  ): Promise<DelegatedSignature> {
    const signerData = await this.signerData();

    const delegatedSignatureWithNonce =
      dataToSign.delegatedSignatureWithNonce ?? (await this.createDelegatedListingSignature());

    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = this.prepareListingParams(
      dataToSign.assetListingParams,
    );

    return prepareTypedDataActionEip712SignatureV1(
      buildExtendedDelegatedListingDataV1(
        dataToSign.salt,
        delegatedSignatureWithNonce.nonce,
        encodedAssets,
        listingParams,
        dataToSign.listingTerms,
        maxLockPeriod,
        immediatePayout,
        dataToSign.universeId,
        delegatedSignatureWithNonce.delegatedSignature.signatureEncodedForProtocol,
      ),
      buildExtendedDelegatedListingPrimaryTypeV1(),
      signerData.signer as unknown as TypedDataSigner,
      signerData.accountId.chainId.reference,
      this.contract.address,
    );
  }

  /**
   * Verify delegated listing signature.
   * @param signature Encoded ECDSA signature.
   * @returns True if signature is valid.
   */
  async verifyDelegatedListingSignature(signature: BytesLike, nonce?: BigNumber): Promise<boolean> {
    const signerData = await this.signerData();
    const delegatedListingCurrentNonce = nonce ?? (await this.getDelegatedListingCurrentNonce(signerData.accountId));

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signerData.accountId.chainId.reference,
      buildDelegatedListingDataV1(delegatedListingCurrentNonce),
      buildDelegatedListingPrimaryTypeV1(),
      signature,
    );

    return address === signerData.address;
  }

  /**
   * Verify extended delegated listing signature.
   * @param signatureData Signature data.
   * @param signature Encoded ECDSA signature.
   * @returns True if signature is valid.
   */
  async verifyExtendedDelegatedListingSignature(
    signatureData: ListingExtendedDelegatedSignatureData,
    signature: BytesLike,
  ): Promise<boolean> {
    const signerData = await this.signerData();

    const delegatedSignatureWithNonce =
      signatureData.delegatedSignatureWithNonce ?? (await this.createDelegatedListingSignature());

    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = this.prepareListingParams(
      signatureData.assetListingParams,
    );

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signerData.accountId.chainId.reference,
      buildExtendedDelegatedListingDataV1(
        signatureData.salt,
        delegatedSignatureWithNonce.nonce,
        encodedAssets,
        listingParams,
        signatureData.listingTerms,
        maxLockPeriod,
        immediatePayout,
        signatureData.universeId,
        delegatedSignatureWithNonce.delegatedSignature.signatureEncodedForProtocol,
      ),
      buildExtendedDelegatedListingPrimaryTypeV1(),
      signature,
    );

    return address === signerData.address;
  }

  private prepareListingParams(assetListingParams: AssetListingParams): {
    encodedAssets: Assets.AssetStruct[];
    listingParams: Listings.ParamsStruct;
    maxLockPeriod: BigNumberish;
    immediatePayout: boolean;
  } {
    const { assets, params, maxLockPeriod, immediatePayout } = assetListingParams;
    const encodedAssets = assets.map(x => this.encodeAsset(x));
    const listingParams: Listings.ParamsStruct = {
      lister: this.accountIdToAddress(params.lister),
      configurator: this.accountIdToAddress(params.configurator),
    };

    return { encodedAssets, listingParams, maxLockPeriod, immediatePayout };
  }
}
