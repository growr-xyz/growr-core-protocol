const hre = require("hardhat");

async function main() {
    const amount = 1000;
    const rawAmount = hre.ethers.utils.parseUnits(amount.toString(), "ether");

    const [owner, account1, account2, _] = await hre.ethers.getSigners();

    const xUSDContract = await hre.ethers.getContractFactory("xUSDMocked");
	const xUSD = await xUSDContract.deploy();

	await xUSD.deployed();
	console.log("xUSD address:", xUSD.address);

    // Distribute equal amount of xUSD token to the first 3 addresses
    await xUSD.connect(owner).mint(rawAmount);
	console.log(`${amount} xUSD distributed to`, owner.address);

    await xUSD.connect(account1).mint(rawAmount);
	console.log(`${amount} xUSD distributed to`, account1.address);

    await xUSD.connect(account2).mint(rawAmount);
	console.log(`${amount} xUSD distributed to`, account2.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
