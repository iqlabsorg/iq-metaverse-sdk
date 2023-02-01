import { AccountId } from 'caip';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { AssetVaultAdapter } from './asset-vault';

export class ERC721AssetVaultAdapter extends AssetVaultAdapter {
  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(accountId, contractResolver, addressTranslator);
  }
}
