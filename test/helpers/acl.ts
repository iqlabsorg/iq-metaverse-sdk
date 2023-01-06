import { IACL } from '../../src/contracts';
import { ethers } from 'hardhat';
import { ROLES_LIBRARY_IDS } from '../../src';

export const grantWizardRolesToDeployer = async (): Promise<void> => {
  const deployer = await ethers.getNamedSigner('deployer');
  const acl = (await ethers.getContract('ACL')) as IACL;
  await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, deployer.address);
  await acl.grantRole(ROLES_LIBRARY_IDS.UNIVERSE_WIZARD_ROLE, deployer.address);
  await acl.grantRole(ROLES_LIBRARY_IDS.WARPER_WIZARD_ROLE, deployer.address);
};
