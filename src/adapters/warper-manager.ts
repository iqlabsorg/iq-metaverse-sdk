import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { Address, RegisteredWarper } from '../types';
import { assetClassToNamespace, pick } from '../utils';

import { WarperManager } from '../contracts';
import { Warpers } from '../contracts/contracts/warper/IWarperController';

export class WarperManagerAdapter extends Adapter {
  private readonly contract: WarperManager;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveWarperManager(accountId.address);
  }

  /**
   * Puts the warper on pause.
   * @param warper Warper reference.
   */
  async pauseWarper(warper: AssetType): Promise<ContractTransaction> {
    return this.contract.pauseWarper(this.assetTypeToAddress(warper));
  }

  /**
   * Lifts the warper pause.
   * @param warper Warper reference.
   */
  async unpauseWarper(warper: AssetType): Promise<ContractTransaction> {
    return this.contract.unpauseWarper(this.assetTypeToAddress(warper));
  }

  /**
   * Returns the number of warpers belonging to the particular universe.
   * @param universeId The universe ID.
   * @return Warper count.
   */
  async universeWarperCount(universeId: BigNumberish): Promise<BigNumber> {
    return this.contract.universeWarperCount(universeId);
  }

  /**
   * Returns the list of warpers belonging to the particular universe.
   * @param universeId The universe ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async universeWarpers(
    universeId: BigNumberish,
    offset: BigNumberish,
    limit: BigNumberish,
  ): Promise<RegisteredWarper[]> {
    const [addresses, warpers] = await this.contract.universeWarpers(universeId, offset, limit);
    return warpers.map((warper, i) => this.normalizeWarper(addresses[i], warper));
  }

  /**
   * Returns the number of warpers associated with the particular original asset.
   * @param asset Original asset reference.
   * @return Warper count.
   */
  async universeAssetWarperCount(universeId: BigNumberish, asset: AssetType): Promise<BigNumber> {
    return this.contract.universeAssetWarperCount(universeId, this.assetTypeToAddress(asset));
  }

  /**
   * Returns the list of warpers belonging to the particular asset in universe.
   * @param universeId The universe ID.
   * @param asset Original asset reference.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async universeAssetWarpers(
    universeId: BigNumberish,
    asset: AssetType,
    offset: BigNumberish,
    limit: BigNumberish,
  ): Promise<RegisteredWarper[]> {
    const [addresses, warpers] = await this.contract.universeAssetWarpers(
      universeId,
      this.assetTypeToAddress(asset),
      offset,
      limit,
    );
    return warpers.map((warper, i) => this.normalizeWarper(addresses[i], warper));
  }

  /**
   * Checks whether `account` is the `warper` admin.
   * @param warper Warper reference.
   * @param account Admin account ID.
   * @return True if the `account` is the admin of the `warper` and false otherwise.
   */
  async isWarperAdmin(warper: AssetType, account: AccountId): Promise<boolean> {
    return this.contract.isWarperAdmin(this.assetTypeToAddress(warper), this.accountIdToAddress(account));
  }

  /**
   * Returns registered warper details.
   * @param warper Warper reference.
   * @return Warper details.
   */
  async warper(warper: AssetType): Promise<RegisteredWarper> {
    const warperAddress = this.assetTypeToAddress(warper);
    const warperInfo = await this.contract.warperInfo(warperAddress);
    return this.normalizeWarper(warperAddress, warperInfo);
  }

  /**
   * Returns metahub account ID.
   */
  async metahub(): Promise<AccountId> {
    const address = await this.contract.metahub();
    return this.addressToAccountId(address);
  }

  /**
   * Returns warper controller account ID.
   * @param warper Warper reference.
   */
  async warperController(warper: AssetType): Promise<AccountId> {
    const address = await this.contract.warperController(this.assetTypeToAddress(warper));
    return this.addressToAccountId(address);
  }

  /**
   * Sets the new controller address for one or multiple registered warpers.
   * @param warpers List of warpers.
   * @param controller Controller account ID.
   */
  async setWarperController(warpers: AssetType[], controller: AccountId): Promise<ContractTransaction> {
    return this.contract.setWarperController(
      warpers.map(x => this.assetTypeToAddress(x)),
      this.accountIdToAddress(controller),
    );
  }

  /**
   * Normalizes warper structure.
   * @param warperAddress
   * @param warper
   * @private
   */
  private normalizeWarper(warperAddress: Address, warper: Warpers.WarperStructOutput): RegisteredWarper {
    const namespace = assetClassToNamespace(warper.assetClass);
    return {
      ...pick(warper, ['name', 'universeId', 'paused']),
      self: this.addressToAssetType(warperAddress, namespace),
      original: this.addressToAssetType(warper.original, namespace),
    };
  }
}
