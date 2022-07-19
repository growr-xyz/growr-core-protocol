const { expect } = require("chai");
const { ethers } = require("hardhat");

const ProtocolHelper = require("../scripts/helpers/Protocol");
const TokenHelper = require("../scripts/helpers/Token");
const ContractHelper = require("../scripts/helpers/Contract");

describe("Testing contract PondFactory", function () {
	let factory, registry, xUSD, wRBTC, signer0, signer1;

	beforeEach(async () => {
		const xUSDAmount = hre.ethers.utils.parseUnits("1000", "ether");

		const WRBTC = await ContractHelper.deploy("WRBTC");
		const XUSD = await TokenHelper.deploy("xUSD Token", "XUSD");
		const { VerificationRegistry, PondFactory } = await ProtocolHelper.deploy({ wrbtcAddress: WRBTC.address });

		registry = VerificationRegistry;
		factory = PondFactory;

		[signer0, signer1, _] = await ethers.getSigners();

		await XUSD.helpers.mint(signer0, xUSDAmount);
		await XUSD.helpers.mint(signer1, xUSDAmount);

		xUSD = XUSD;
		wRBTC = WRBTC;
	});

	describe("Creating xUSD Pond", () => {
		it("Positive case - Should create a pond", async () => {
			expect(await factory.helpers.createPond({ token: xUSD.address }, {})).to.emit(factory, "PondCreated");

			const userPondsLength = await factory.getUserPondsLength(signer0.address);

			expect(userPondsLength).to.equal(1);
		});

		it("Positive case - Should transfer pond ownership to the caller", async () => {
			await factory.helpers.createPond({ token: xUSD.address }, {});

			const userPondsLength = await factory.getUserPondsLength(signer0.address);
			const pondAddress = await factory.getUserPond(signer0.address, userPondsLength - 1);

			const pond = await ContractHelper.attach("Pond", pondAddress);
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

	describe("Creating WRBTC Pond", () => {
		it("Positive case - Deposit and Withdraw RBTC", async () => {
			const rBTCAmount = hre.ethers.utils.parseUnits("10", "ether");
			await factory.helpers.createPond({ token: wRBTC.address }, {});

			const userPondsLength = await factory.getUserPondsLength(signer0.address);
			const pondAddress = await factory.getUserPond(signer0.address, userPondsLength - 1);

			const pond = await ContractHelper.attach("Pond", pondAddress);
			const balanceBeforeDeposit = await signer0.getBalance();

			await pond.connect(signer0).depositRBTC(rBTCAmount, { value: rBTCAmount });

			const pondAvailableBalance = await pond.getAvailableBalance();
			const wrbtcPondBalance = await wRBTC.balanceOf(pond.address);

			const balanceAfterDeposit = await signer0.getBalance();

			await pond.withdrawRBTC(rBTCAmount);
			// await pond.withdraw(rBTCAmount);
			const pondAvailableBalanceAfterWitdhraw = await pond.getAvailableBalance();

			expect(pondAvailableBalance).to.equal(wrbtcPondBalance);
			expect(pondAvailableBalanceAfterWitdhraw).to.equal(0);
			expect(balanceAfterDeposit).to.lt(balanceBeforeDeposit);
		});
	});

	describe("Destroy a Pond", () => {
		it("Positive case - Destroy empty pond", async () => {
			await factory.helpers.createPond({ token: xUSD.address }, {});

			const userPondAddress = await factory.getUserPond(signer0.address, 0);
			const pondAddress = await factory.getPond(0);

			await factory.destroyPond(userPondAddress);

			const destroyedUserPondAddress = await factory.getUserPond(signer0.address, 0);
			const destroyedPondAddress = await factory.getPond(0);

			expect(pondAddress != destroyedPondAddress).to.equal(true);
			expect(userPondAddress != destroyedUserPondAddress).to.equal(true);
			expect(destroyedUserPondAddress).to.equal("0x0000000000000000000000000000000000000000");
			expect(destroyedPondAddress).to.equal("0x0000000000000000000000000000000000000000");
		});

		it("Negative case - Destroy pond created by another user", async () => {
			await factory.helpers.createPond({ token: xUSD.address }, {});
			await factory.helpers.createPond({ token: xUSD.address }, {});

			const pondAddress = await factory.getUserPond(signer0.address, 0);

			expect(factory.connect(signer1).destroyPond(pondAddress)).to.throw
		});

		it("Negative case - Destroy pond with active funds", async () => {
			const amount = hre.ethers.utils.parseUnits("10", "ether");

			await factory.helpers.createPond({ token: xUSD.address }, {});

			const pondAddress = await factory.getUserPond(signer0.address, 0);
			const pond = await ContractHelper.attach("Pond", pondAddress);

			await xUSD.connect(signer0).approve(pondAddress, amount);
			await pond.connect(signer0).deposit(amount);

			await expect(factory.destroyPond(pondAddress)).to.be.revertedWith(
				"Growr. - Pond cannot be destroyed due to active deposits"
			);
		});
	});
});
