const { expect } = require("chai");
const { ethers } = require("hardhat");

const PondFactoryUtils = require("./PondFactory.utils");

describe("Testing contract Pond", function () {
	let factory, factoryUtils, pond, xUSD, signer0, signer1;

	beforeEach(async () => {
		const xUSDAmount = hre.ethers.utils.parseUnits("1000", "ether");

		const PondFactory = await ethers.getContractFactory("PondFactory");
		const xUSDContract = await ethers.getContractFactory("xUSDMocked");
		const PondContract = await ethers.getContractFactory("Pond");

		factory = await PondFactory.deploy();
		xUSD = await xUSDContract.deploy();

		await factory.deployed();
		await xUSD.deployed();

		[signer0, signer1, _] = await ethers.getSigners();

		await xUSD.connect(signer0).mint(xUSDAmount);
		await xUSD.connect(signer1).mint(xUSDAmount);

		factoryUtils = PondFactoryUtils(factory, xUSD);

		await factoryUtils.createPond(
			{},
			{
				names: ["citizenship"],
				types: ["string"],
				contents: ["SV"],
				operators: ["="],
			}
		);
		const userPondsLength = await factory.getUserPondsLength(signer0.address);
		const pondAddress = await factory.getUserPond(signer0.address, userPondsLength - 1);

		pond = await PondContract.attach(pondAddress);

		await xUSD.connect(signer0).approve(pondAddress, ethers.utils.parseUnits("500", "ether"));
		await pond.connect(signer0).deposit(ethers.utils.parseUnits("500", "ether"));
	});

	describe("Getting a loan offer", () => {
		// it("Positive case - Get pond details", async () => {
		// 	const details = await pond.getDetails();

		// 	expect(details._params.name).to.equal("Pond 1");
		// });

		it("Positive case - No credential check", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
		});

		it("Positive case - Should approve with minLoanAmount", async () => {
			const amount = ethers.utils.parseUnits("10", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.amount).to.equal(factoryUtils.defaultParams.minLoanAmount);
		});

		it("Positive case - Should approve with maxLoanAmount", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.amount).to.equal(factoryUtils.defaultParams.maxLoanAmount);
		});

		it("Positive case - Should approve with minLoanDuration", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 0, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.duration).to.equal(factoryUtils.defaultParams.minLoanDuration);
		});

		it("Positive case - Should approve with maxLoanDuration", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 24, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.duration).to.equal(factoryUtils.defaultParams.maxLoanDuration);
		});

		it("Positive case - Should not approve with wrong credentials", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: ["citizenship2"], contents: ["SV"] });

			expect(offer.approved).to.equal(false);
		});

		it("Negative case - Should throw error for invalid credentials", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			await expect(pond.getLoanOffer(amount, 10, { names: [], contents: ["SV"] })).to.be.revertedWith(
				"Growr. - Invalid personal credentials"
			);
		});
	});
});
