const hre = require("hardhat");

const ProtocolHelper = require("../helpers/Protocol");
const ContractHelper = require("../helpers/Contract");

// const WRBTC_ADDRESS = "not implemented";

async function main() {
	const WRBTC = await ContractHelper.deploy("WRBTC");
	const { VerificationRegistry, PondFactory, wrbtcAddress } = await ProtocolHelper.deploy({
		wrbtcAddress: WRBTC.address,
	});

	console.log(`VerificationRegistry \t: ${VerificationRegistry.address}`);
	console.log(`PondFactory \t\t: ${PondFactory.address}`);
	console.log(`WRBTC \t\t\t: ${wrbtcAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
