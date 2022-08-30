const hre = require("hardhat");

const TokenHelper = require("../helpers/Token");

async function main() {
	const amount = 1000;

	const [owner, account1, account2, _] = await hre.ethers.getSigners();

	const XUSD = await TokenHelper.deploy("xUSD Token", "XUSD");
	const DOC = await TokenHelper.deploy("DOC Token", "DOC");

	console.log("xUSD address:", XUSD.address);
	console.log("DOC address:", DOC.address);

	// Distribute equal amount of xUSD tokens to the first 3 addresses
	await XUSD.helpers.mintAndLog(owner, amount);
	await XUSD.helpers.mintAndLog(account1, amount);
	await XUSD.helpers.mintAndLog(account2, amount);

	// Distribute equal amount of DOC tokens to the first 3 addresses
	await DOC.helpers.mintAndLog(owner, amount);
	await DOC.helpers.mintAndLog(account1, amount);
	await DOC.helpers.mintAndLog(account2, amount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
