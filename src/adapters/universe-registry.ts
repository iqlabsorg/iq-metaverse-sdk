import { AccountId, AssetType } from 'caip';
import { BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { assetClasses } from '../constants';
import { ContractResolver } from '../contract-resolver';
import { UniverseRegistry } from '../contracts';
import { UniverseCreatedEventObject } from '../contracts/contracts/universe/UniverseRegistry';
import { UniverseInfo } from '../types';

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
   */
  async universeInfo(universeId: BigNumberish): Promise<UniverseInfo> {
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

  /**
   * Sets Universe base URI.
   * @param baseURI Universe base URI.
   */
  async setUniverseTokenBaseURI(baseURI: string): Promise<ContractTransaction> {
    return this.contract.setUniverseTokenBaseURI(baseURI);
  }

  /**
   * Registers new payment token for universe.
   * @param universeId Universe ID.
   * @param paymentToken Payment token.
   */
  async registerUniversePaymentToken(universeId: BigNumberish, paymentToken: AccountId): Promise<ContractTransaction> {
    return this.contract.registerUniversePaymentToken(universeId, this.accountIdToAddress(paymentToken));
  }

  /**
   * Removes payment token from universe.
   * @param universeId Universe ID.
   * @param paymentToken Payment token.
   */
  async removeUniversePaymentToken(universeId: BigNumberish, paymentToken: AccountId): Promise<ContractTransaction> {
    return this.contract.removeUniversePaymentToken(universeId, this.accountIdToAddress(paymentToken));
  }

  /**
   * Checks if contract is universe wizard.
   * @param contract Contract account ID.
   */
  async isUniverseWizard(contract: AccountId): Promise<boolean> {
    return this.contract.isUniverseWizard(this.accountIdToAddress(contract));
  }

  /**
   * Returns universe registry contract key.
   */
  async contractKey(): Promise<string> {
    return this.contract.contractKey();
  }

  /**
   * Checks if interface is supported.
   * @param interfaceId Interface ID.
   */
  async supportsInterface(interfaceId: BytesLike): Promise<boolean> {
    return this.contract.supportsInterface(interfaceId);
  }
}
