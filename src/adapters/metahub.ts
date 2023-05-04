import { CONTRACT_REGISTRY } from '@iqprotocol/iq-space-protocol-light';
import { Metahub } from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { AccountBalance, Asset, BaseToken } from '../types';

export class MetahubAdapter extends Adapter {
  private readonly contract: Metahub;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveMetahub(accountId.address);
  }

  //#region Protocol Configuration

  /**
   * Returns the base token that's used for stable price denomination.
   */
  async baseToken(): Promise<BaseToken> {
    const type = this.addressToAssetType(await this.contract.baseToken(), 'erc20');
    const metadata = await this.erc20AssetMetadata(type);
    return { type, ...metadata };
  }

  //#endregion

  //#region Payment Management

  /**
   * Returns the amount of `token`, currently accumulated by the user.
   * @param account The account to query the balance for.
   * @param token The token in which the balance is nominated.
   */
  async balance(account: AccountId, token: AssetType): Promise<BigNumber> {
    return this.contract.balance(this.accountIdToAddress(account), this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of user balances in various tokens.
   * @param account The account to query the balance for.
   */
  async balances(account: AccountId): Promise<AccountBalance[]> {
    const balances = await this.contract.balances(this.accountIdToAddress(account));
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Returns the amount of `token`, currently accumulated by the universe.
   * @param universeId The universe ID.
   * @param token The token address.
   */
  async universeBalance(universeId: BigNumberish, token: AssetType): Promise<BigNumber> {
    return this.contract.universeBalance(universeId, this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of universe balances in various tokens.
   * @param universeId The universe ID.
   */
  async universeBalances(universeId: BigNumberish): Promise<AccountBalance[]> {
    const balances = await this.contract.universeBalances(universeId);
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Transfers the specific `amount` of `token` from a user balance to an arbitrary address.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawFunds(token: AssetType, amount: BigNumberish, to: AccountId): Promise<ContractTransaction> {
    return this.contract.withdrawFunds(this.assetTypeToAddress(token), amount, this.accountIdToAddress(to));
  }

  /**
   * Transfers the specific `amount` of `token` from a universe balance to an arbitrary address.
   * @param universeId The universe ID.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawUniverseFunds(
    universeId: BigNumberish,
    token: AssetType,
    amount: BigNumberish,
    to: AccountId,
  ): Promise<ContractTransaction> {
    return this.contract.withdrawUniverseFunds(
      universeId,
      this.assetTypeToAddress(token),
      amount,
      this.accountIdToAddress(to),
    );
  }

  //#endregion

  //#region Asset Management

  /**
   * Returns the number of currently supported assets.
   * @return Asset count.
   */
  async supportedAssetCount(): Promise<BigNumber> {
    return this.contract.supportedAssetCount();
  }

  /**
   * Returns the list of all supported assets.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async supportedAssets(offset: BigNumberish, limit: BigNumberish): Promise<AssetType[]> {
    const [addresses, assetConfigs] = await this.contract.supportedAssets(offset, limit);
    return assetConfigs.map((assetConfig, i) =>
      this.addressToAssetType(addresses[i], this.decodeAssetClass(assetConfig.assetClass)),
    );
  }

  //#endregion

  //#region Approvals

  /**
   * Sets payment token allowance. Allows Metahub to spend specified tokens to cover rental fees.
   * @param paymentToken ERC20 payment token.
   * @param amount Allowance amount.
   */
  async approveForRentalPayment(paymentToken: AssetType, amount: BigNumberish): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .approve(this.contract.address, amount);
  }

  /**
   * Returns current Metahub allowance in specified payment tokens for specific payer account.
   * @param paymentToken ERC20 payment token.
   * @param payer Payer account ID.
   */
  async paymentTokenAllowance(paymentToken: AssetType, payer: AccountId): Promise<BigNumber> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .allowance(this.accountIdToAddress(payer), this.contract.address);
  }

  /**
   * Approves Metahub to take an asset from lister account during listing process.
   * @param asset
   */
  async approveForListing(asset: Asset): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC721(asset.id);
    return this.contractResolver
      .resolveERC721Asset(this.assetIdToAddress(asset.id))
      .approve(this.contract.address, asset.id.tokenId);
  }

  /**
   * Approves Metahub to take any assets (from given collection) from lister account during listing process.
   * @param asset Some asset from requested for approval collection.
   */
  async approveAllForListing(asset: Asset): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC721(asset.id);
    return this.contractResolver
      .resolveERC721Asset(this.assetIdToAddress(asset.id))
      .setApprovalForAll(this.contract.address, true);
  }

  /**
   * Checks whether the asset is approved for listing by the owner.
   * Returns `true` if the asset can be listed, and `false` if the required approval is missing.
   * @param asset
   */
  async isApprovedForListing(asset: Asset): Promise<boolean> {
    AddressTranslator.assertTypeERC721(asset.id);

    // Check particular token allowance.
    const assetContract = this.contractResolver.resolveERC721Asset(this.assetIdToAddress(asset.id));
    //eslint-disable-next-line no-extra-parens
    if ((await assetContract.getApproved(asset.id.tokenId)) === this.contract.address) {
      return true;
    }

    // Check operator.
    const assumedOwner = (await this.signerData()).address;
    return assetContract.isApprovedForAll(assumedOwner, this.contract.address);
  }

  //#endregion

  /**
   * @dev Returns warper preset factory address.
   */
  async warperPresetFactory(): Promise<AccountId> {
    const address = await this.contract.getContract(CONTRACT_REGISTRY.WarperPresetFactory.contractRegistryKeyId);
    return this.addressToAccountId(address);
  }
}
