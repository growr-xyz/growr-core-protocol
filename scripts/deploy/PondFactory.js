const hre = require("hardhat");

async function main() {
	const PondFactory = await hre.ethers.getContractFactory("PondFactory");

	const Factory = await PondFactory.deploy();

	await Factory.deployed();

	console.log(`PondFactory address: ${Factory.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
