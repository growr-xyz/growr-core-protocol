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

	describe.skip("Getting a loan offer", () => {
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

	describe("Get a real loan", async () => {
		it.skip("Positive case - Get a loan", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const duration = 5;

			const LoanContract = await ethers.getContractFactory("Loan");

			const balanceBefore = await xUSD.balanceOf(signer0.address);

			await pond.borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(signer0.address);

			const loanAddress = await pond.getLoan(signer0.address);
			const loan = LoanContract.attach(loanAddress);

			const details = await loan.getDetails();

			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(details._params.amount).to.equal(amount);
			expect(details._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay more than installment amount", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("50", "ether");

			const duration = 5;

			const LoanContract = await ethers.getContractFactory("Loan");

			const balanceBefore = await xUSD.balanceOf(signer0.address);

			await pond.borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(signer0.address);

			const loanAddress = await pond.getLoan(signer0.address);
			const loan = LoanContract.attach(loanAddress);

			const detailsBefore = await loan.getDetails();

			console.log(detailsBefore);

			await xUSD.approve(pond.address, repayAmount);
			await pond.repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			console.log(detailsAfter);

			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});
	});
});
