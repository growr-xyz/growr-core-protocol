const { expect } = require("chai");
const { ethers } = require("hardhat");

const ProtocolHelper = require("../scripts/helpers/Protocol");
const TokenHelper = require("../scripts/helpers/Token");
const ContractHelper = require("../scripts/helpers/Contract");

const { defaultParams } = require("../scripts/helpers/PondFactoryContract");

describe("Testing contract Pond", function () {
	let factory, registry, pond, xUSD, wRBTC, owner, verifier, borrower, signer1;

	beforeEach(async () => {
		const xUSDAmount = hre.ethers.utils.parseUnits("1000", "ether");

		const XUSD = await TokenHelper.deploy("xUSD Token", "XUSD");

		const WRBTC = await ContractHelper.deploy("WRBTC");
		const { VerificationRegistry, PondFactory } = await ProtocolHelper.deploy({ wrbtcAddress: WRBTC.address });

		registry = VerificationRegistry;
		factory = PondFactory;

		[owner, verifier, borrower, signer1] = await ethers.getSigners();

		await XUSD.helpers.mint(owner, xUSDAmount);
		await XUSD.helpers.mint(verifier, xUSDAmount);
		await XUSD.helpers.mint(borrower, xUSDAmount);
		await XUSD.helpers.mint(signer1, xUSDAmount);

		xUSD = XUSD;
        wRBTC = WRBTC;

		await PondFactory.helpers.createPond(
			{ token: xUSD.address },
			{
				names: ["citizenship"],
				types: ["string"],
				contents: ["SV"],
				operators: ["="],
			}
		);
		const userPondsLength = await factory.getUserPondsLength(owner.address);
		const pondAddress = await factory.getUserPond(owner.address, userPondsLength - 1);

		pond = await ContractHelper.attach("Pond", pondAddress);

		await xUSD.connect(owner).approve(pondAddress, ethers.utils.parseUnits("500", "ether"));
		await pond.connect(owner).deposit(ethers.utils.parseUnits("500", "ether"));

		await registry.connect(owner).addVerifier(verifier.address);
		await registry.connect(verifier).registerVerification(borrower.address, pondAddress, 5 * 60);
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
			expect(offer.amount).to.equal(defaultParams.minLoanAmount);
		});

		it("Positive case - Should approve with maxLoanAmount", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.amount).to.equal(defaultParams.maxLoanAmount);
		});

		it("Positive case - Should approve with minLoanDuration", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 0, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.duration).to.equal(defaultParams.minLoanDuration);
		});

		it("Positive case - Should approve with maxLoanDuration", async () => {
			const amount = ethers.utils.parseUnits("1000", "ether");
			const offer = await pond.getLoanOffer(amount, 24, { names: [], contents: [] });

			expect(offer.approved).to.equal(true);
			expect(offer.duration).to.equal(defaultParams.maxLoanDuration);
		});

		it("Positive case - Should not approve with wrong credentials", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: ["citizenship2"], contents: ["SV"] });

			expect(offer.approved).to.equal(false);
		});

		it("Positive case - Should not approve with invalid credentials", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const offer = await pond.getLoanOffer(amount, 10, { names: [], contents: ["SV"] });
			expect(offer.approved).to.equal(false);
		});
	});

	describe("Get a real loan", async () => {
		it("Positive case - Get a loan", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const details = await loan.getDetails();

			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(details._params.amount).to.equal(amount);
			expect(details._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay partial installment interest payment", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("0.5", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("32", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("2", "ether"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay partial installment payment", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("20", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("12.5", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("0", "ether"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay full installment payment + partial interest payment", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("34", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("31", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("1", "ether"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay full + partial installment payment", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("50", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("15", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("0", "ether"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay 2 full installment payments", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("65", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("32.5", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("2.5", "ether"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Positive case - Repay full loan", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const repayAmount = ethers.utils.parseUnits("162.5", "ether");

			const duration = 5;

			const balanceBefore = await xUSD.balanceOf(borrower.address);

			await pond.connect(borrower).borrow(amount, duration);

			const balanceAfter = await xUSD.balanceOf(borrower.address);

			const loanAddress = await pond.getLoan(borrower.address);
			const loan = await ContractHelper.attach("Loan", loanAddress);

			const detailsBefore = await loan.getDetails();

			await xUSD.connect(borrower).approve(pond.address, repayAmount);
			await pond.connect(borrower).repay(repayAmount, loanAddress);

			const detailsAfter = await loan.getDetails();

			expect(detailsAfter._receipt.nextInstallment.total).to.equal(ethers.utils.parseUnits("0", "ether"));
			expect(detailsAfter._receipt.nextInstallment.interest).to.equal(ethers.utils.parseUnits("0", "ether"));
			// expect(detailsAfter._receipt.nextInstallmentDate).to.equal(ethers.utils.parseUnits("0", "ethers"));
			expect(balanceBefore).to.be.lt(balanceAfter);
			expect(detailsBefore._params.amount).to.equal(amount);
			expect(detailsBefore._params.duration.toNumber()).to.equal(duration);
		});

		it("Negative case - Reject loan if borrower is not eligible", async () => {
			const amount = ethers.utils.parseUnits("150", "ether");
			const duration = 5;

			await registry.connect(verifier).revokeVerification(borrower.address, pond.address);
			await expect(pond.connect(borrower).borrow(amount, duration)).to.revertedWith(
				"Growr. - Eligibility verificaiton failed"
			);
		});
	});

	describe("Withdraw funds", () => {
		it("Positive case - Withdraw full deposit(not utilizied yet)", async () => {
			const amount = ethers.utils.parseUnits("500", "ether");

			const beforeWithdraw = await pond.getLenderBalance(owner.address);
			const beforeBalance = await xUSD.balanceOf(owner.address);
			await pond.withdraw(amount);
			const afterWithdraw = await pond.getLenderBalance(owner.address);
			const afterBalance = await xUSD.balanceOf(owner.address);

			expect(beforeWithdraw).to.be.gt(afterWithdraw);
			expect(afterWithdraw).to.equal(ethers.utils.parseUnits("0", "ether"));
			expect(beforeBalance).to.be.lt(afterBalance);
		});

		it("Negative case - Withdraw more than deposited(not utilizied yet)", async () => {
			const amount = ethers.utils.parseUnits("550", "ether");

			await expect(pond.withdraw(amount)).to.be.revertedWith("Growr. - Withdrawal amount exceeds your balance");
		});

		it("Negative case - The user is not a lender", async () => {
			const amount = ethers.utils.parseUnits("550", "ether");

			await expect(pond.connect(signer1).withdraw(amount)).to.be.revertedWith(
				"Growr. - Withdrawal amount exceeds your balance"
			);
		});

		it("Negative case - Withdraw more than available balance", async () => {
			const amount = ethers.utils.parseUnits("450", "ether");

			const borrowAmount = ethers.utils.parseUnits("150", "ether");
			const duration = 5;
			await pond.connect(borrower).borrow(borrowAmount, duration);

			await expect(pond.withdraw(amount)).to.be.revertedWith(
				"Growr. - Withdrawal amount exceeds available balance"
			);
		});
	});
});
