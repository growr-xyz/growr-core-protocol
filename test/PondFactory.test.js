const { expect } = require("chai");
const { ethers } = require("hardhat");

const ProtocolHelper = require("../scripts/helpers/Protocol");
const TokenHelper = require("../scripts/helpers/Token");

describe("Testing contract PondFactory", function () {
	let factory, registry, xUSD, signer0, signer1;

	beforeEach(async () => {
		const xUSDAmount = hre.ethers.utils.parseUnits("1000", "ether");

		const { VerificationRegistry, PondFactory } = await ProtocolHelper.deploy({ wrbtcAddress: null });
		const XUSD = await TokenHelper.deploy("xUSD Token", "XUSD");

		registry = VerificationRegistry;
		factory = PondFactory;

		[signer0, signer1, _] = await ethers.getSigners();

		await XUSD.helpers.mint(signer0, xUSDAmount);
		await XUSD.helpers.mint(signer1, xUSDAmount);

		xUSD = XUSD;
	});

	describe("Creating a new Pond", () => {
		it("Positive case - Should create a pond", async () => {
			expect(await factory.helpers.createPond({ token: xUSD.address }, {})).to.emit(factory, "PondCreated");

			const userPondsLength = await factory.getUserPondsLength(signer0.address);

			expect(userPondsLength).to.equal(1);
		});

		it("Positive case - Should transfer pond ownership to the caller", async () => {
			await factory.helpers.createPond({ token: xUSD.address }, {});

			const PondContract = await ethers.getContractFactory("Pond");

			const userPondsLength = await factory.getUserPondsLength(signer0.address);
			const pondAddress = await factory.getUserPond(signer0.address, userPondsLength - 1);

			const pond = PondContract.attach(pondAddress);

			expect(await pond.owner()).to.equal(signer0.address);
		});

		it("Negative case - Invalid pond name", async () => {
			await expect(
				factory.helpers.createPond({
					token: xUSD.address,
					name: "",
				})
			).to.be.revertedWith("Growr. - Invalid pond name");
		});

		it("Negative case - Cashback rate >= annual interest rate", async () => {
			await expect(
				factory.helpers.createPond({
					token: xUSD.address,
					annualInterestRate: 5,
					cashBackRate: 5,
				})
			).to.be.revertedWith("Growr. - Cashback rate should be less than annual interest rate");
		});

		it("Negative case - minLoanAmount >= maxLoanAmount", async () => {
			await expect(
				factory.helpers.createPond(
					{
						token: xUSD.address,
						minLoanAmount: ethers.utils.parseUnits("100", "ether"),
						maxLoanAmount: ethers.utils.parseUnits("50", "ether"),
					},
					{}
				)
			).to.be.revertedWith("Growr. - minLoanAmount should be less than maxLoanAmount");
		});

		it("Negative case - minLoanDuration >= maxLoanDuration", async () => {
			await expect(
				factory.helpers.createPond({ token: xUSD.address, minLoanDuration: 5, maxLoanDuration: 1 }, {})
			).to.be.revertedWith("Growr. - minLoanDuration should be less than maxLoanDuration");
		});

		it("Negative case - Invalid pond criteria", async () => {
			await expect(factory.helpers.createPond({ token: xUSD.address }, { names: [] })).to.be.revertedWith(
				"Growr. - Invalid pond criteria"
			);
		});
	});
});
