const { expect } = require("chai");
const { ethers } = require("hardhat");

const defaultParams = {
	name: "Pond 1",
	minLoanAmount: 100,
	maxLoanAmount: 500,
	minLoanDuration: 1,
	maxLoanDuration: 12,
	annualInterestRate: 20,
	disbursmentFee: 5,
	cashBackRate: 5,
};
const defaultCriteria = {
	names: ["citizenship"],
	types: ["string"],
	contents: ["SV"],
	operations: ["="],
};

describe("Testing contract PondFactory", function () {
	let factory, xUSD, signer0, signer1;

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
	});

	describe("Creating a new Pond", () => {
		const _createPond = async (_params, _criteria) => {
			_params = {
				...defaultParams,
				..._params,
			};
			_criteria = {
				...defaultCriteria,
				..._criteria,
			};

			await factory.createPond(
				{
					name: _params.name,
					token: xUSD.address,
					minLoanAmount: hre.ethers.utils.parseUnits(_params.minLoanAmount.toString(), "ether"),
					maxLoanAmount: hre.ethers.utils.parseUnits(_params.maxLoanAmount.toString(), "ether"),
					minLoanDuration: hre.ethers.utils.parseUnits(_params.minLoanDuration.toString(), "ether"),
					maxLoanDuration: hre.ethers.utils.parseUnits(_params.maxLoanDuration.toString(), "ether"),
					annualInterestRate: hre.ethers.utils.parseUnits(_params.annualInterestRate.toString(), "ether"),
					disbursmentFee: hre.ethers.utils.parseUnits(_params.disbursmentFee.toString(), "ether"),
					cashBackRate: hre.ethers.utils.parseUnits(_params.cashBackRate.toString(), "ether"),
				},
				_criteria
			);
		};

		it("Positive case - Should create a pond", async () => {
			await _createPond({}, {});

			const userPonds = await factory.getUserPonds(signer0.address);

			expect(userPonds.length).to.equal(1);
		});

		it("Positive case - Should transfer pond ownership to the caller", async () => {
			await _createPond({}, {});

			const PondContract = await ethers.getContractFactory("Pond");

			const [pondAddress] = await factory.getUserPonds(signer0.address);
			const pond = await PondContract.attach(pondAddress);

			expect(await pond.owner()).to.equal(signer0.address);
		});

		it("Negative case - Invalid pond name", async () => {
			await expect(
				_createPond({
					name: "",
				})
			).to.be.revertedWith("Growr. - Invalid pond name");
		});

		it("Negative case - Cashback rate >= annual interest rate", async () => {
			await expect(
				_createPond({
					annualInterestRate: 5,
					cashBackRate: 5,
				})
			).to.be.revertedWith("Growr. - Cashback rate should be less than annual interest rate");
		});

		it("Negative case - minLoanAmount >= maxLoanAmount", async () => {
			await expect(_createPond({ minLoanAmount: 100, maxLoanAmount: 50 }, {})).to.be.revertedWith(
				"Growr. - minLoanAmount should be less than maxLoanAmount"
			);
		});

		it("Negative case - minLoanDuration >= maxLoanDuration", async () => {
			await expect(_createPond({ minLoanDuration: 5, maxLoanDuration: 1 }, {})).to.be.revertedWith(
				"Growr. - minLoanDuration should be less than maxLoanDuration"
			);
		});

		it("Negative case - Invalid pond criteria", async () => {
			await expect(_createPond({}, { names: [] })).to.be.revertedWith("Growr. - Invalid pond criteria");
		});
	});
});
