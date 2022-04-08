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
	solidity: {
		version: "0.8.4",
		settings: {
			optimizer: {
				runs: 200,
				enabled: true,
			},
		},
	},
	defaultNetwork: "localhost",
	networks: {
		hardhat: {
		},
		localhost: {
			url: "http://localhost:8545",
			chainId: 31337,
		},
		rskTestNet: {
			url: "https://public-node.testnet.rsk.co",
			chainId: 31,
			accounts: ["private key"] // Replace with your private key here
		}
	},
	mocha: {
		timeout: 40000,
	},
};
