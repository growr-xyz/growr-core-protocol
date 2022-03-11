const hre = require("hardhat");

async function main() {
  const amount = 1000;
  const rawAmount = hre.ethers.utils.parseUnits(amount.toString(), "ether");

  const [owner, account1, account2, _] = await hre.ethers.getSigners();

  const DOCContract = await hre.ethers.getContractFactory("DOCMocked");
  const DOC = await DOCContract.deploy();

  await DOC.deployed();
  console.log("DOC address:", DOC.address);

  // Distribute equal amount of DOC token to the first 3 addresses
  await DOC.connect(owner).mint(rawAmount);
  console.log(`${amount} DOC distributed to`, owner.address);

  await DOC.connect(account1).mint(rawAmount);
  console.log(`${amount} DOC distributed to`, account1.address);

  await DOC.connect(account2).mint(rawAmount);
  console.log(`${amount} DOC distributed to`, account2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
