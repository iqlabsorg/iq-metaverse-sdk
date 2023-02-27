import { AccountId } from 'caip';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { AssetVaultAdapter } from './asset-vault';

export class ERC721AssetVaultAdapter extends AssetVaultAdapter {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(accountId, contractResolver, addressTranslator);
  }
}
