import { ERC721ConfigurablePreset__factory } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { ERC721WarperAdapter, IQSpace } from '../src';
import { setupUniverseAndRegisteredWarper } from './helpers/setup';

/**
 * @group integration
 */
describe('ERC721WarperAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** SDK */
  let iqspace: IQSpace;
  let warperAdapter: ERC721WarperAdapter;

  /** Data Structs */
  let warperReference: AssetType;

  const start = Math.round(Date.now() / 1000);
  const end = Math.round(Date.now() / 1000 + 60 * 30);

  const setConstraints = async (): Promise<void> => {
    await ERC721ConfigurablePreset__factory.connect(
      warperReference.assetName.reference,
      deployer,
    ).__setAvailabilityPeriodStart(start);
    await ERC721ConfigurablePreset__factory.connect(warperReference.assetName.reference, deployer).__setMinRentalPeriod(
      start,
    );

    await ERC721ConfigurablePreset__factory.connect(
      warperReference.assetName.reference,
      deployer,
    ).__setAvailabilityPeriodEnd(end);
    await ERC721ConfigurablePreset__factory.connect(warperReference.assetName.reference, deployer).__setMaxRentalPeriod(
      end,
    );
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    const { warperData } = await setupUniverseAndRegisteredWarper();
    warperReference = warperData.warperReference;

    iqspace = await IQSpace.init({ signer: deployer });
    warperAdapter = iqspace.warperERC721(warperReference);
  });

  describe('rentingConstraints', () => {
    beforeEach(async () => {
      await setConstraints();
    });

    it('should return warpers renting constraints', async () => {
      const { availabilityPeriod, rentalPeriod } = await warperAdapter.rentingConstraints();
      expect(availabilityPeriod?.start).to.be.eq(start);
      expect(availabilityPeriod?.end).to.be.eq(end);
      expect(rentalPeriod?.min).to.be.eq(start);
      expect(rentalPeriod?.max).to.be.eq(end);
    });
  });
});
