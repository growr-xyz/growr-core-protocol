const hre = require("hardhat");

const ProtocolHelper = require("../helpers/Protocol");
const ContractHelper = require("../helpers/Contract");
const TokenHelper = require("../helpers/Token");

async function main() {
	const WRBTC = await ContractHelper.deploy("WRBTC");
	const xUSD = await TokenHelper.deploy("xUSD", "xUSD");

	const [owner, investor] = await hre.ethers.getSigners();

	await xUSD.helpers.mint(owner, 1000);
	await xUSD.helpers.mint(investor, 2000);

	const { VerificationRegistry, PondFactory, wrbtcAddress } = await ProtocolHelper.deploy({
		wrbtcAddress: WRBTC.address,
	});

	await PondFactory.helpers.createPond({
		name: "Pond 1",
		token: xUSD.address,
		minLoanDuration: 3,
		maxLoanDuration: 10,
		minLoanAmount: ethers.utils.parseUnits("100", "ether"),
		maxLoanAmount: ethers.utils.parseUnits("500", "ether"),
	});
	await PondFactory.helpers.createPond({
		name: "Pond2 ",
		token: xUSD.address,
		minLoanDuration: 6,
		maxLoanDuration: 12,
		minLoanAmount: ethers.utils.parseUnits("300", "ether"),
		maxLoanAmount: ethers.utils.parseUnits("1000", "ether"),
	});

	const firstPond = await PondFactory.getPond(0);
	const secondPond = await PondFactory.getPond(1);

	const Pond1 = await ContractHelper.attach("Pond", firstPond);
	const Pond2 = await ContractHelper.attach("Pond", secondPond);

	await xUSD.connect(investor).approve(Pond1.address, ethers.utils.parseUnits("1000", "ether"));
	await xUSD.connect(investor).approve(Pond2.address, ethers.utils.parseUnits("1000", "ether"));

	await Pond1.connect(investor).deposit(ethers.utils.parseUnits("1000", "ether"));
	await Pond2.connect(investor).deposit(ethers.utils.parseUnits("1000", "ether"));

	await VerificationRegistry.connect(owner).addVerifier(owner.address);
	// GET address FROM Accounts generated from the node and use the same to connect in metamask
	await VerificationRegistry.connect(owner).addVerifier("0xdd2fd4581271e230360230f9337d5c0430bf44c0");

	console.log(`VerificationRegistry \t: ${VerificationRegistry.address}`);
	console.log(`PondFactory \t\t: ${PondFactory.address}`);
	console.log(`WRBTC \t\t\t: ${wrbtcAddress}`);
	console.log(`XUSD \t\t\t: ${xUSD.address}`);
	console.log(`Created 2 Ponds`);
	console.log(`Pond1\t\t\t: ${Pond1.address}`);
	console.log(`Pond2\t\t\t: ${Pond2.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
