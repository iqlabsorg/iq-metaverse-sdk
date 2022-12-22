import { ROLES_LIBRARY_IDS } from '@iqprotocol/solidity-contracts-nft/src/constants';
import { IACL } from '../../src/contracts';
import { ethers } from 'hardhat';

export const grantRoles = async (listingWizard: string, universeWizard: string): Promise<void> => {
  const acl = (await ethers.getContract('ACL')) as IACL;
  await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, listingWizard);
  await acl.grantRole(ROLES_LIBRARY_IDS.UNIVERSE_WIZARD_ROLE, universeWizard);
};
