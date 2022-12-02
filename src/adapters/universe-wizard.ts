import { AccountId } from 'caip';
import { ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { IUniverseRegistry, UniverseWizard } from '../contracts';
import { UniverseParams } from '../types';

export class UniverseWizardAdapter extends Adapter {
  private readonly contract: UniverseWizard;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveUniverseWizard(accountId.address);
  }

  /**
   * Creates new Universe. This includes minting new universe NFT, where the caller of this method becomes the
   * universe owner.
   * @param params The universe properties & initial configuration params.
   */
  async setupUniverse(params: UniverseParams): Promise<ContractTransaction> {
    const universeParams: IUniverseRegistry.UniverseParamsStruct = {
      name: params.name,
      paymentTokens: params.paymentTokens.map(x => this.accountIdToAddress(x)),
    };
    return this.contract.setupUniverse(universeParams);
  }
}
