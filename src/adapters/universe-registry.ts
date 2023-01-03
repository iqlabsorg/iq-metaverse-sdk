import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { UniverseCreatedEventObject } from '../contracts/contracts/universe/universe-registry/IUniverseRegistry';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { assetClasses } from '../constants';
import { ContractResolver } from '../contract-resolver';
import { UniverseRegistry } from '../contracts';
import { UniverseInfo } from '../types';

export class UniverseRegistryAdapter extends Adapter {
  private readonly contract: UniverseRegistry;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveUniverseRegistry(accountId.address);
  }

  /**
   * Retrieves the universe details from creation transaction.
   * @param transactionHash
   */
  async findUniverseByCreationTransaction(transactionHash: string): Promise<UniverseInfo | undefined> {
    const tx = await this.contract.provider.getTransaction(transactionHash);
    if (!tx.blockHash) {
      return undefined;
    }

    const event = (await this.contract.queryFilter(this.contract.filters.UniverseCreated(), tx.blockHash)).find(
      event => event.transactionHash === transactionHash,
    );

    return event
      ? {
          id: event.args.universeId,
          name: event.args.name,
          paymentTokens: event.args.paymentTokens.map(x => this.addressToAccountId(x)),
        }
      : undefined;
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
    return {
      id: BigNumber.from(universeId),
      name: info.name,
      paymentTokens: info.paymentTokens.map(x => this.addressToAccountId(x)),
    };
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
}
