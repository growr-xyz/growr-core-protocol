const hre = require("hardhat");

const xUSDAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

async function main() {
	const maxAmount = 100;
	const minLoanSize = 0;
	const maxLoanSize = 100;
	const disbursementFee = 5;

	const rawMaxPondSize = hre.ethers.utils.parseUnits(maxAmount.toString(), "ether");
	const rawMinLoanSize = hre.ethers.utils.parseUnits(minLoanSize.toString(), "ether");
	const rawMaxLoanSize = hre.ethers.utils.parseUnits(maxLoanSize.toString(), "ether");

	const GrowrPond = await hre.ethers.getContractFactory("GrowrPond");

	const Pond = await GrowrPond.deploy(
		"Pond1",
		xUSDAddress,
		disbursementFee,
		"0x0",
		rawMaxPondSize,
		rawMinLoanSize,
		rawMaxLoanSize
	);

	await Pond.deployed();

	console.log(`Pond address: ${Pond.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
