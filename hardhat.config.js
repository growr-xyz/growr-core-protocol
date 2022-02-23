require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: "0.8.4",
	defaultNetwork: "localhost",
	networks: {
		localhost: {
			url: "http://localhost:8545",
			chainId: 31337,
		},
	},
	settings: {
		optimizer: {
			runs: 200,
			enabled: true,
		},
	},
};
