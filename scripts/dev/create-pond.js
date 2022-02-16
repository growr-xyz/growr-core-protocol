const hre = require("hardhat");

const xUSDAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

async function main() {
	const maxAmount = 100;
	const depositAmount = 10;
	const minLoanSize = 0;
	const maxLoanSize = 100;
	const minCreditRating = 0;
	const disbursementFee = 5;
	const borrowAmount = 10;
	const repayAmount = 2;

	const rawBorrowAmount = hre.ethers.utils.parseUnits(borrowAmount.toString(), "ether");
	const rawMaxPondSize = hre.ethers.utils.parseUnits(maxAmount.toString(), "ether");
	const rawDepositAmount = hre.ethers.utils.parseUnits(depositAmount.toString(), "ether");
	const rawMinLoanSize = hre.ethers.utils.parseUnits(minLoanSize.toString(), "ether");
	const rawMaxLoanSize = hre.ethers.utils.parseUnits(maxLoanSize.toString(), "ether");
	const rawRepayAmount = hre.ethers.utils.parseUnits(repayAmount.toString(), "ether");

	const [owner, account1, account2, _] = await hre.ethers.getSigners();

	const GrowrPond = await hre.ethers.getContractFactory("GrowrPond");
	const xUSD = await hre.ethers.getContractAt("xUSDMocked", xUSDAddress);

	console.log(`xUSD balance ${await xUSD.balanceOf(owner.address)}`);

	const Pond = await GrowrPond.deploy(
		"Pond1",
		xUSDAddress,
		disbursementFee,
		"0x0",
		rawMaxPondSize,
		rawMinLoanSize,
		rawMaxLoanSize
	);

	await Pond.deployed();
	console.log("Pond address:", Pond.address);

	await xUSD.approve(Pond.address, rawDepositAmount);

	await Pond.deposit(rawDepositAmount);
	console.log(`Deposited ${depositAmount} xUSD`);
	const depositStats = await Pond.getLenderStats(owner.address);
	console.log("Depositor stats", {
		principal: depositStats.principal,
		accruedInterest: depositStats.accruedInterest,
		currentShare: depositStats.currentShare,
		minShare: depositStats.minShare,
	});

	await Pond.borrow(rawBorrowAmount);
	console.log(`Borrowed ${borrowAmount} xUSD`);
	const createdLoan = await Pond.getBorrowerStats(owner.address);
	console.log(`Created Loan `, createdLoan);

	for await (const i of Array(10).fill()) {
		ethers.provider.send("evm_mine");
	}

	const loanStats = await Pond.getBorrowerStats(owner.address);
	console.log(`Get Loan`, loanStats);

	await xUSD.approve(Pond.address, rawRepayAmount);

	await Pond.repay(rawRepayAmount);
	console.log(`Repaid ${repayAmount} xUSD`);
	const repaidLoan = await Pond.getBorrowerStats(owner.address);
	console.log(`Repaid Loan `, repaidLoan);

	const withdrawStats = await Pond.getLenderStats(owner.address);
	console.log("Depositor stats", {
		principal: withdrawStats.principal,
		accruedInterest: withdrawStats.accruedInterest,
		currentShare: withdrawStats.currentShare,
		minShare: withdrawStats.minShare,
	});

	await Pond.withdraw(0, withdrawStats.accruedInterest);
	console.log(`Withdrew accrued interest of ${ethers.utils.formatUnits(withdrawStats.accruedInterest, 18)} xUSD`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
