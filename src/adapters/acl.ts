import { AccountId } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { ACL } from '../contracts';

export class ACLAdapter extends Adapter {
  private readonly contract: ACL;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveACL(accountId.address);
  }

  /**
   * Get the admin role describing bytes.
   */
  async adminRole(): Promise<string> {
    return this.contract.adminRole();
  }

  /**
   * Get the supervisor role describing bytes.
   */
  async supervisorRole(): Promise<string> {
    return this.contract.supervisorRole();
  }

  /**
   * Get the listing wizard role describing bytes.
   */
  async listingWizardRole(): Promise<string> {
    return this.contract.listingWizardRole();
  }

  /**
   * Get the universe wizard role describing bytes.
   */
  async universeWizardRole(): Promise<string> {
    return this.contract.universeWizardRole();
  }

  /**
   * Get the token quote signer role describing bytes.
   */
  async tokenQuoteSignerRole(): Promise<string> {
    return this.contract.tokenQuoteSignerRole();
  }

  /**
   * Grants role to account.
   * @param role Role bytes.
   * @param account User account ID.
   */
  async grantRole(role: string, account: AccountId): Promise<ContractTransaction> {
    return this.contract.grantRole(role, this.accountIdToAddress(account));
  }

  /**
   * Revokes role from account.
   * @param role Role bytes.
   * @param account User account ID.
   */
  async revokeRole(role: string, account: AccountId): Promise<ContractTransaction> {
    return this.contract.revokeRole(role, this.accountIdToAddress(account));
  }

  /**
   * Revokes role from the calling account.
   * @param role Role bytes.
   */
  async renounceRole(role: string) {
    const signerAddress = await this.signerAddress();
    return this.contract.renounceRole(role, signerAddress);
  }

  /**
   * Returns true if role has been granted to account.
   * @param role Role bytes.
   * @param account User account ID.
   */
  async hasRole(role: string, account: AccountId): Promise<boolean> {
    return this.contract.hasRole(role, this.accountIdToAddress(account));
  }

  /**
   * Returns the admin role bytes which controls the given role.
   * @param role Role bytes.
   */
  async getRoleAdmin(role: string): Promise<string> {
    return this.contract.getRoleAdmin(role);
  }

  /**
   * Returns role members.
   * @param role Role bytes.
   */
  async getRoleMembers(role: string): Promise<AccountId[]> {
    const memberCount = (await this.contract.getRoleMemberCount(role)).toNumber();

    const membersProm = [...Array(memberCount).keys()].map(async i => this.contract.getRoleMember(role, i));
    const members = await Promise.all(membersProm);
    return members.map(member => this.addressToAccountId(member));
  }
}
