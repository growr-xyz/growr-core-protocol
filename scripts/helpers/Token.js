const hre = require("hardhat");

module.exports.deploy = async function (name, symbol) {
	const TokenContract = await hre.ethers.getContractFactory("Token");
	const Token = await TokenContract.deploy(name, symbol);

	await Token.deployed();

	const _mint = async (signer, amount) => {
		const rawAmount = hre.ethers.utils.parseUnits(amount.toString(), "ether");

		await Token.connect(signer).mint(rawAmount);
	};

	Token.helpers = {
		mint: async (signer, amount) => {
			await _mint(signer, amount);
		},
		mintAndLog: async (signer, amount) => {
			await _mint(signer, amount);
			console.log(`Distributed ${amount} ${symbol} to`, signer.address);
		},
	};

	return Token;
};
