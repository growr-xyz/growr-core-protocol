const hre = require("hardhat");

const mint = async (Token, signer, amount) => {
	const rawAmount = hre.ethers.utils.parseUnits(amount.toString(), "ether");
	const symbol = await Token.symbol();

	await Token.connect(signer).mint(rawAmount);
    
	console.log(`${amount} ${symbol} distributed to`, signer.address);
};

async function main() {
	const amount = 1000;

	const [owner, account1, account2, _] = await hre.ethers.getSigners();

	const TokenContract = await hre.ethers.getContractFactory("Token");
	const XUSD = await TokenContract.deploy("xUSD Token", "XUSD");
	const DOC = await TokenContract.deploy("DOC Token", "DOC");

	await XUSD.deployed();
	await DOC.deployed();

	console.log("xUSD address:", XUSD.address);
	console.log("DOC address:", DOC.address);

	// Distribute equal amount of xUSD tokens to the first 3 addresses
	await mint(XUSD, owner, amount);
	await mint(XUSD, account1, amount);
	await mint(XUSD, account2, amount);

	// Distribute equal amount of DOC tokens to the first 3 addresses
	await mint(DOC, owner, amount);
	await mint(DOC, account1, amount);
	await mint(DOC, account2, amount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
