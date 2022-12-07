import { AccountId, AssetType } from 'caip';
import { BigNumberish, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { assetClasses } from '../constants';
import { ContractResolver } from '../contract-resolver';
import { UniverseRegistry } from '../contracts';
import { UniverseCreatedEventObject } from '../contracts/contracts/universe/UniverseRegistry';

export class UniverseRegistryAdapter extends Adapter {
  private readonly contract: UniverseRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveUniverseRegistry(accountId.address);
  }

  /**
   * Retrieves the universe details form creation transaction.
   * @param transactionHash
   */
  async findUniverseByCreationTransaction(transactionHash: string): Promise<UniverseCreatedEventObject | undefined> {
    const tx = await this.contract.provider.getTransaction(transactionHash);
    if (!tx.blockHash) {
      return undefined;
    }

    const event = (await this.contract.queryFilter(this.contract.filters.UniverseCreated(), tx.blockHash)).find(
      event => event.transactionHash === transactionHash,
    );

    return event ? event.args : undefined;
  }

  /**
   * Returns `true` if the universe owner is the supplied account address.
   * @param universeId The universe ID.
   * @param accountId The expected owner account.
   */
  async isUniverseOwner(universeId: BigNumberish, accountId: AccountId): Promise<boolean> {
    return this.contract.isUniverseOwner(universeId, this.accountIdToAddress(accountId));
  }

  /**
   * Updates the universe name.
   * @param universeId The universe ID.
   * @param name The universe name to set.
   */
  async setUniverseName(universeId: BigNumberish, name: string): Promise<ContractTransaction> {
    return this.contract.setUniverseName(universeId, name);
  }

  /**
   * Returns aggregated universe data.
   * @param universeId The universe ID.
   * @return {{ name: string, rentalFeePercent: number }}
   */
  async universeInfo(universeId: BigNumberish): Promise<{ name: string; paymentTokens: AccountId[] }> {
    const info = await this.contract.universe(universeId);
    return { name: info.name, paymentTokens: info.paymentTokens.map(x => this.addressToAccountId(x)) };
  }

  /**
   * Returns Universe owner address.
   * @param universeId Universe ID.
   * @return Universe owner.
   */
  async universeOwner(universeId: BigNumberish): Promise<AccountId> {
    return this.addressToAccountId(await this.contract.universeOwner(universeId));
  }

  /**
   * Returns the Universe token address.
   */
  async universeToken(): Promise<AssetType> {
    return this.addressToAssetType(await this.contract.universeToken(), assetClasses.ERC721.namespace);
  }

  /**
   * Returns the Universe token base URI.
   */
  async universeTokenBaseURI(): Promise<string> {
    return this.contract.universeTokenBaseURI();
  }
}
