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
import { AccountId } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { ListingExtendedDelegatedSignatureVerificationData } from 'src';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ListingCoder } from '../../coders';
import { BLOCK_GAS_LIMIT, NOMINAL_BATCH_GAS_LIMIT, NOMINAL_BATCH_SIZE } from '../../constants';
import { ContractResolver } from '../../contract-resolver';
import { ListingHelper } from '../../helpers';
import {
  AssetListingParams,
  DelegatedSignature,
  DelegatedSignatureWithNonce,
  ListingBatch,
  ListingBatchTransaction,
  ListingExtendedDelegatedSignatureData,
  TrackedListingParams,
} from '../../types';
import { sleep } from '../../utils';

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
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      assetListingParams,
      this.addressTranslator,
    );

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
   * Estimates the gas amount needed for creating new asset listing.
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   */
  async estimateCreateListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
  ): Promise<BigNumber> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      assetListingParams,
      this.addressTranslator,
    );

    return this.contract.estimateGas.createListingWithTerms(
      encodedAssets,
      listingParams,
      listingTerms,
      maxLockPeriod,
      immediatePayout,
      universeId,
    );
  }

  /**
   * Creates multiple asset listings.
   * @param listings List of listings.
   */
  async createListingsWithTerms(listings: TrackedListingParams[]): Promise<ListingBatchTransaction[]> {
    const batches = await this.createBatches(listings);
    const transactions: ListingBatchTransaction[] = [];

    for (const batch of batches) {
      await sleep(50);

      if (batch.calls.length === 1) {
        const { signer } = await this.signerData();
        transactions.push({
          transaction: await signer.sendTransaction({ to: this.contract.address, data: batch.calls[0] }),
          trackingIds: batch.trackingIds,
        });
        continue;
      }

      transactions.push({ transaction: await this.contract.multicall(batch.calls), trackingIds: batch.trackingIds });
    }

    return transactions;
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
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      assetListingParams,
      this.addressTranslator,
    );

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
   * Estimates the gas amount needed for creating new asset listing (delegated).
   * @param universeId Universe ID.
   * @param assetListingParams Listing params.
   * @param listingTerms Listing terms.
   * @param delegatedListingSignature Delegated Listing ECDSA signature ABI encoded (v,r,s)(uint8, bytes32, bytes32).
   */
  async estimateDelegatedCreateListingWithTerms(
    universeId: BigNumberish,
    assetListingParams: AssetListingParams,
    listingTerms: IListingTermsRegistry.ListingTermsStruct,
    delegatedListingSignature: BytesLike,
  ): Promise<BigNumber> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      assetListingParams,
      this.addressTranslator,
    );

    return this.contract.estimateGas.delegatedCreateListingWithTerms(
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
   * Create delegated listing ABI encoded (v,r,s)(uint8, bytes32, bytes32) typed data signature (EIP712).
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
   * Create extended delegated listing ABI encoded (v,r,s)(uint8, bytes32, bytes32) typed data signature (EIP712).
   * Caller should be the actual lister.
   * @param dataToSign Data to sign.
   * @param delegatedSignatureWithNonce ABI encoded typed data signature with nonce (optional).
   */
  async createExtendedDelegatedListingSignature(
    dataToSign: ListingExtendedDelegatedSignatureData,
    delegatedSignatureWithNonce?: DelegatedSignatureWithNonce,
  ): Promise<DelegatedSignature> {
    const signerData = await this.signerData();

    delegatedSignatureWithNonce = delegatedSignatureWithNonce ?? (await this.createDelegatedListingSignature());

    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      dataToSign.assetListingParams,
      this.addressTranslator,
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
   * @param signer Signers account ID.
   * @param signature Typed data signature (EIP712).
   * @returns True if signature is valid.
   */
  async verifyDelegatedListingSignature(signer: AccountId, signature: BytesLike, nonce?: BigNumber): Promise<boolean> {
    const delegatedListingCurrentNonce = nonce ?? (await this.getDelegatedListingCurrentNonce(signer));

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signer.chainId.reference,
      buildDelegatedListingDataV1(delegatedListingCurrentNonce),
      buildDelegatedListingPrimaryTypeV1(),
      signature,
    );

    return address === signer.address;
  }

  /**
   * Verify extended delegated listing signature.
   * @param signer Signers account ID.
   * @param signatureData Signature verification data.
   * @param signature Typed data signature (EIP712).
   * @returns True if signature is valid.
   */
  async verifyExtendedDelegatedListingSignature(
    signer: AccountId,
    signatureData: ListingExtendedDelegatedSignatureVerificationData,
    signature: BytesLike,
  ): Promise<boolean> {
    const { encodedAssets, listingParams, maxLockPeriod, immediatePayout } = ListingHelper.prepareListingParams(
      signatureData.assetListingParams,
      this.addressTranslator,
    );

    const address = verifyTypedDataActionEip712SignatureV1(
      this.contract.address,
      signer.chainId.reference,
      buildExtendedDelegatedListingDataV1(
        signatureData.salt,
        signatureData.delegatedSignatureWithNonce.nonce,
        encodedAssets,
        listingParams,
        signatureData.listingTerms,
        maxLockPeriod,
        immediatePayout,
        signatureData.universeId,
        signatureData.delegatedSignatureWithNonce.delegatedSignature.signatureEncodedForProtocol,
      ),
      buildExtendedDelegatedListingPrimaryTypeV1(),
      signature,
    );

    return address === signer.address;
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

  private async createBatch(
    listings: TrackedListingParams[],
  ): Promise<{ batch: ListingBatch; leftOver: TrackedListingParams[] }> {
    if (listings.length === 1) {
      // if we are here, then most likely this is a heavy transaction
      const call = ListingCoder.encodeCreateListingWithTermsCall(listings[0], this.contract, this.addressTranslator);
      const { signer } = await this.signerData();

      const estimate = await signer.estimateGas({ to: this.contract.address, data: call });
      if (estimate.gt(BLOCK_GAS_LIMIT)) {
        throw new Error('Listing creation will exceed block gas limit');
      }

      return {
        leftOver: [],
        batch: { calls: [call], trackingIds: [listings[0].trackingId] },
      };
    }

    const calls = listings.map(listing =>
      ListingCoder.encodeCreateListingWithTermsCall(listing, this.contract, this.addressTranslator),
    );

    const estimate = await this.contract.estimateGas.multicall(calls);
    if (estimate.lte(NOMINAL_BATCH_GAS_LIMIT)) {
      return { leftOver: [], batch: { calls, trackingIds: listings.map(listing => listing.trackingId) } };
    }

    const removedListing = listings.pop()!;
    const { leftOver, batch: recursiveBatch } = await this.createBatch(listings);
    leftOver.push(removedListing);

    return { leftOver, batch: recursiveBatch };
  }

  private async createBatches(listings: TrackedListingParams[]): Promise<ListingBatch[]> {
    const batches: ListingBatch[] = [];

    while (listings.length > 0) {
      const { leftOver, batch } = await this.createBatch(listings.splice(0, NOMINAL_BATCH_SIZE));
      listings = listings.concat(leftOver);
      batches.push(batch);
      await sleep(100);
    }

    return batches;
  }
}
