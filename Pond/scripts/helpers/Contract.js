const hre = require("hardhat");

module.exports.deploy = async function (contractName, ...params) {
	const ContractFactory = await hre.ethers.getContractFactory(contractName);

	const Contract = await ContractFactory.deploy(...params);

	await Contract.deployed();

	return Contract;
};

module.exports.attach = async (contractName, address) => {
	const Contract = await ethers.getContractFactory(contractName);

	return Contract.attach(address);
};
