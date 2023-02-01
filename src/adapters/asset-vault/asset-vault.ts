import { AccountId } from 'caip';
import { BigNumberish, ContractTransaction } from 'ethers';
import { AssetNamespace } from 'src/types';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { AssetVault } from '../../contracts';

export abstract class AssetVaultAdapter extends Adapter {
  private readonly _contract: AssetVault;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this._contract = contractResolver.resolveAssetVault(this.accountIdToAddress(accountId));
  }

  /**
   * Activates asset recovery mode.
   */
  async switchToRecoveryMode(): Promise<ContractTransaction> {
    return this._contract.switchToRecoveryMode();
  }

  /**
   * Returns vault recovery mode flag state.
   */
  async isRecovery(): Promise<boolean> {
    return this._contract.isRecovery();
  }

  /**
   * Pauses the vault.
   */
  async pause(): Promise<ContractTransaction> {
    return this._contract.pause();
  }

  /**
   * Unpauses the vault.
   */
  async unpause(): Promise<ContractTransaction> {
    return this._contract.unpause();
  }

  /**
   * Send ERC20 tokens to an address.
   * @param token ERC20 token account ID.
   * @param to Receiver account ID.
   * @param amount Amount.
   */
  async withdrawERC20Tokens(token: AccountId, to: AccountId, amount: BigNumberish): Promise<ContractTransaction> {
    return this._contract.withdrawERC20Tokens(this.accountIdToAddress(token), this.accountIdToAddress(to), amount);
  }

  /**
   * Returns vault asset class as a CAIP-19 namespace.
   */
  async assetClass(): Promise<AssetNamespace> {
    const bytes = await this._contract.assetClass();
    return this.decodeAssetClass(bytes);
  }

  /**
   * Returns the Metahub account ID.
   */
  async metahub(): Promise<AccountId> {
    const address = await this._contract.metahub();
    return this.addressToAccountId(address);
  }
}
