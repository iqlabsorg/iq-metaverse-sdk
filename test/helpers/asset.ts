import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

export const mintAndApproveNFTs = async (
  collection: ERC721Mock,
  owner: SignerWithAddress,
  count = 1,
): Promise<void> => {
  const metahub = await ethers.getContract('Metahub');

  await mintNFTs(collection, owner, count);
  await collection.connect(owner).setApprovalForAll(metahub.address, true);
};

export const mintNFTs = async (collection: ERC721Mock, owner: SignerWithAddress, count = 1): Promise<void> => {
  const nftCreator = await ethers.getNamedSigner('nftCreator');

  for (let i = 1; i <= count; i++) {
    await collection.connect(nftCreator).mint(owner.address, i);
  }
};
