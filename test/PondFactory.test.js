const { expect } = require("chai");
const { ethers } = require("hardhat");

const PondFactoryUtils = require("./PondFactory.utils");

describe.skip("Testing contract PondFactory", function () {
	let factory, factoryUtils, xUSD, signer0, signer1;

	beforeEach(async () => {
		const xUSDAmount = hre.ethers.utils.parseUnits("1000", "ether");

		const PondFactory = await ethers.getContractFactory("PondFactory");
		const xUSDContract = await ethers.getContractFactory("xUSDMocked");

		factory = await PondFactory.deploy();
		xUSD = await xUSDContract.deploy();

		await factory.deployed();
		await xUSD.deployed();

		[signer0, signer1, _] = await ethers.getSigners();

		await xUSD.connect(signer0).mint(xUSDAmount);
		await xUSD.connect(signer1).mint(xUSDAmount);

		factoryUtils = PondFactoryUtils(factory, xUSD);
	});

	describe("Creating a new Pond", () => {
		it("Positive case - Should create a pond", async () => {
			expect(await factoryUtils.createPond({}, {})).to.emit(factory, "PondCreated");

			const userPondsLength = await factory.getUserPondsLength(signer0.address);

			expect(userPondsLength).to.equal(1);
		});

		it("Positive case - Should transfer pond ownership to the caller", async () => {
			await factoryUtils.createPond({}, {});

			const PondContract = await ethers.getContractFactory("Pond");

			const userPondsLength = await factory.getUserPondsLength(signer0.address);
			const pondAddress = await factory.getUserPond(signer0.address, userPondsLength - 1);

			const pond = await PondContract.attach(pondAddress);

			expect(await pond.owner()).to.equal(signer0.address);
		});

		it("Negative case - Invalid pond name", async () => {
			await expect(
				factoryUtils.createPond({
					name: "",
				})
			).to.be.revertedWith("Growr. - Invalid pond name");
		});

		it("Negative case - Cashback rate >= annual interest rate", async () => {
			await expect(
				factoryUtils.createPond({
					annualInterestRate: 5,
					cashBackRate: 5,
				})
			).to.be.revertedWith("Growr. - Cashback rate should be less than annual interest rate");
		});

		it("Negative case - minLoanAmount >= maxLoanAmount", async () => {
			await expect(
				factoryUtils.createPond(
					{
						minLoanAmount: ethers.utils.parseUnits("100", "ether"),
						maxLoanAmount: ethers.utils.parseUnits("50", "ether"),
					},
					{}
				)
			).to.be.revertedWith("Growr. - minLoanAmount should be less than maxLoanAmount");
		});

		it("Negative case - minLoanDuration >= maxLoanDuration", async () => {
			await expect(factoryUtils.createPond({ minLoanDuration: 5, maxLoanDuration: 1 }, {})).to.be.revertedWith(
				"Growr. - minLoanDuration should be less than maxLoanDuration"
			);
		});

		it("Negative case - Invalid pond criteria", async () => {
			await expect(factoryUtils.createPond({}, { names: [] })).to.be.revertedWith(
				"Growr. - Invalid pond criteria"
			);
		});
	});
});
