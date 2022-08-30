const hre = require("hardhat");

const ContractHelper = require("./Contract");
const PondFactoryHelper = require("./PondFactoryContract");

module.exports.deploy = async function ({ wrbtcAddress }) {
	// if (!wrbtcAddress) {
	//     wrbtcAddress =
	// }

	const VerificationRegistry = await ContractHelper.deploy("VerificationRegistry");
	const PondFactory = await PondFactoryHelper.deploy(VerificationRegistry.address, wrbtcAddress);
    
	return { VerificationRegistry, PondFactory, wrbtcAddress };
};
