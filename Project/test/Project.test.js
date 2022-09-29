const { expect } = require("chai");

const {
	deployFactory,
	createProject,
	defaultCriteria,
	LoanStatus,
	VerificatorType,
	createLoans,
} = require("../scripts/helpers/Protocol");

describe("Project.sol", function () {
	let Factory,
		Project,
		deployerAccount,
		ownerAccount,
		credentialVerificatorAccount,
		paymentVerificatorAccount,
		otherAccount,
		borrowerAccount;

	this.beforeAll(async () => {
		[
			deployerAccount,
			ownerAccount,
			borrowerAccount,
			credentialVerificatorAccount,
			paymentVerificatorAccount,
			otherAccount,
		] = await ethers.getSigners();

		Factory = await deployFactory();
		Project = await createProject(Factory.connect(ownerAccount), { id: "project-1234" });
	});

	describe("Whitelist verificator", function () {
		describe("Positive suites", () => {
			it("Should add credential verificator", async () => {
				const verificatorBefore = await Project.verificators(credentialVerificatorAccount.address);

				const tx = await Project.connect(ownerAccount).addVerificator(
					credentialVerificatorAccount.address,
					VerificatorType.CREDENTIAL
				);
				await tx.wait();

				const verificatorAfter = await Project.verificators(credentialVerificatorAccount.address);

				expect(verificatorBefore.hasCredentialAccess).to.be.false;
				expect(verificatorAfter.hasCredentialAccess).to.be.true;
				expect(verificatorBefore.hasPaymentAccess).to.be.false;
				expect(verificatorAfter.hasPaymentAccess).to.be.false;
			});

			it("Should remove credential verificator", async () => {
				const verificatorBefore = await Project.verificators(credentialVerificatorAccount.address);

				const tx = await Project.connect(ownerAccount).removeVerificator(
					credentialVerificatorAccount.address,
					VerificatorType.CREDENTIAL
				);
				await tx.wait();

				const verificatorAfter = await Project.verificators(credentialVerificatorAccount.address);

				expect(verificatorBefore.hasCredentialAccess).to.be.true;
				expect(verificatorAfter.hasCredentialAccess).to.be.false;
				expect(verificatorBefore.hasPaymentAccess).to.be.false;
				expect(verificatorAfter.hasPaymentAccess).to.be.false;
			});

			it("Should add payment verificator", async () => {
				const verificatorBefore = await Project.verificators(paymentVerificatorAccount.address);

				const tx = await Project.connect(ownerAccount).addVerificator(
					paymentVerificatorAccount.address,
					VerificatorType.PAYMENT
				);
				await tx.wait();

				const verificatorAfter = await Project.verificators(paymentVerificatorAccount.address);

				expect(verificatorBefore.hasCredentialAccess).to.be.false;
				expect(verificatorAfter.hasCredentialAccess).to.be.false;
				expect(verificatorBefore.hasPaymentAccess).to.be.false;
				expect(verificatorAfter.hasPaymentAccess).to.be.true;
			});

			it("Should remove payment verificator", async () => {
				const verificatorBefore = await Project.verificators(paymentVerificatorAccount.address);

				const tx = await Project.connect(ownerAccount).removeVerificator(
					paymentVerificatorAccount.address,
					VerificatorType.PAYMENT
				);
				await tx.wait();

				const verificatorAfter = await Project.verificators(paymentVerificatorAccount.address);

				expect(verificatorBefore.hasCredentialAccess).to.be.false;
				expect(verificatorAfter.hasCredentialAccess).to.be.false;
				expect(verificatorBefore.hasPaymentAccess).to.be.true;
				expect(verificatorAfter.hasPaymentAccess).to.be.false;
			});
		});

		describe("Negative suites", () => {
			it("Should not add credential verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).addVerificator(
						credentialVerificatorAccount.address,
						VerificatorType.CREDENTIAL
					)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not remove credential verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).removeVerificator(
						credentialVerificatorAccount.address,
						VerificatorType.CREDENTIAL
					)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not add credential verificator if project is deactivated", async () => {
				await Factory.connect(ownerAccount).changeProjectStatus(Project.address, false);

				await expect(
					Project.connect(ownerAccount).addVerificator(
						credentialVerificatorAccount.address,
						VerificatorType.CREDENTIAL
					)
				).to.be.revertedWith("Growr. - project is deactivated");
			});

			it("Should not remove credential verificator if project is deactivated", async () => {
				await Factory.connect(ownerAccount).changeProjectStatus(Project.address, false);

				await expect(
					Project.connect(ownerAccount).removeVerificator(
						credentialVerificatorAccount.address,
						VerificatorType.CREDENTIAL
					)
				).to.be.revertedWith("Growr. - project is deactivated");
			});

			it("Should not add payment verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).addVerificator(
						paymentVerificatorAccount.address,
						VerificatorType.PAYMENT
					)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not remove payment verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).removeVerificator(
						paymentVerificatorAccount.address,
						VerificatorType.PAYMENT
					)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not add payment verificator if project is deactivated", async () => {
				await Factory.connect(ownerAccount).changeProjectStatus(Project.address, false);

				await expect(
					Project.connect(ownerAccount).addVerificator(
						paymentVerificatorAccount.address,
						VerificatorType.PAYMENT
					)
				).to.be.revertedWith("Growr. - project is deactivated");
			});

			it("Should not remove payment verificator if project is deactivated", async () => {
				await Factory.connect(ownerAccount).changeProjectStatus(Project.address, false);

				await expect(
					Project.connect(ownerAccount).removeVerificator(
						paymentVerificatorAccount.address,
						VerificatorType.PAYMENT
					)
				).to.be.revertedWith("Growr. - project is deactivated");
			});
		});
	});

	describe("Criteria", () => {
		it("Should match the default criteria", async () => {
			const criteria = await Project.getProjectCriteria();

			criteria.forEach((crit, i) => {
				expect(crit._exists).to.be.true;
				expect(crit._name).to.be.equal(defaultCriteria.names[i]);
				expect(crit._type).to.be.equal(defaultCriteria.types[i]);
				expect(crit._content).to.be.equal(defaultCriteria.contents[i]);
				expect(crit._operator).to.be.equal(defaultCriteria.operators[i]);
			});
		});
	});

	describe("Loan", function () {
		this.beforeAll(async () => {
			// ensure the project is active
			await Factory.connect(ownerAccount).changeProjectStatus(Project.address, true);
			await Project.connect(ownerAccount).addVerificator(
				credentialVerificatorAccount.address,
				VerificatorType.CREDENTIAL
			);
			await Project.connect(ownerAccount).addVerificator(
				paymentVerificatorAccount.address,
				VerificatorType.PAYMENT
			);
		});

		describe("Positive suites", function () {
			it("Should create a single loan", async () => {
				const borrower = borrowerAccount.address;
				const amount = 500;
				const docId = 1;

				const args = await createLoans(
					Project.connect(ownerAccount),
					borrowerAccount,
					credentialVerificatorAccount,
					amount,
					docId
				);

				const loans = await Project.getLoansByBorrower(borrower);

				expect(loans.length).to.be.equal(1);
				expect(loans[0].docId).to.be.equal(docId);
				expect(loans[0].amount).to.be.equal(amount);
				expect(loans[0].borrower).to.be.equal(borrower);
				expect(args.loanId).to.be.equal(0);
				expect(args.borrower).to.be.equal(borrower);
				expect(args.docId).to.be.equal(docId);
			});

			it("Should cancel all loans", async () => {
				const docId = 1;
				const loanId = 0;

				const tx = await Project.connect(paymentVerificatorAccount).cancelLoans(docId);
				const receipt = await tx.wait();

				const loan = await Project.getLoanById(loanId);
				const args = receipt.events.filter((e) => e.event === "LoanStatusChanged")[0].args;

				expect(loan.status).to.be.equal(LoanStatus.CANCELED);
				expect(args.loanId).to.be.equal(loanId);
				expect(args.verificator).to.be.equal(paymentVerificatorAccount.address);
				expect(args.docId).to.be.equal(docId);
				expect(args.status).to.be.equal(LoanStatus.CANCELED);
			});

			it("Should disburse all loans", async () => {
				const txId = "tx-id";
				const docId = 2;

				const { loanId } = await createLoans(
					Project.connect(ownerAccount),
					borrowerAccount,
					credentialVerificatorAccount,
					500,
					docId
				);

				const tx = await Project.connect(paymentVerificatorAccount).disburseLoans(docId, txId);
				const receipt = await tx.wait();

				const loan = await Project.getLoanById(loanId);

				const args = receipt.events.filter((e) => e.event === "LoanStatusChanged")[0].args;

				expect(await Project.getTxIdByDocId(docId)).to.be.equal(txId);
				expect(loan.status).to.be.equal(LoanStatus.DISBURSED);
				expect(args.loanId).to.be.equal(loanId);
				expect(args.verificator).to.be.equal(paymentVerificatorAccount.address);
				expect(args.docId).to.be.equal(docId);
				expect(args.status).to.be.equal(LoanStatus.DISBURSED);
			});

			it("Should get all loans by a given borrower", async () => {
				const loans = await Project.getLoansByBorrower(borrowerAccount.address);

				expect(loans.length).to.be.equal(2);
			});

			it("Should get all loans by a given document id", async () => {
				const loans = await Project.getLoansByDocument(1);

				expect(loans.length).to.be.equal(1);
			});

			it("Should get all loans by a given status", async () => {
				const canceled = await Project.getLoansByStatus(LoanStatus.CANCELED);
				const disbursed = await Project.getLoansByStatus(LoanStatus.DISBURSED);

				expect(canceled.length).to.be.equal(1);
				expect(disbursed.length).to.be.equal(1);
			});
		});

		describe("Negative suites", function () {
			let loanToCancel, loanToDisburse;

			this.beforeAll(async () => {
				loanToCancel = await createLoans(Project, borrowerAccount, credentialVerificatorAccount, 100, 3);
				loanToDisburse = await createLoans(Project, borrowerAccount, credentialVerificatorAccount, 100, 4);
			});
			/**
			 * TODO: add create loan
			 */
			it("Should not cancel loans if docId does not exists", async () => {
				await expect(Project.connect(paymentVerificatorAccount).cancelLoans(1000)).to.be.revertedWith(
					"Growr. - no loans found"
				);
			});

			it("Should not cancel loans if the caller is not a whitelisted payment verificator", async () => {
				await expect(Project.connect(otherAccount).cancelLoans(loanToCancel.docId)).to.be.revertedWith(
					"Growr. - payment verificator is not whitelisted"
				);
			});

			it("Should not cancel loans if they are already disbursed", async () => {
				await Project.connect(paymentVerificatorAccount).disburseLoans(loanToCancel.docId, "");

				await expect(
					Project.connect(paymentVerificatorAccount).cancelLoans(loanToCancel.docId)
				).to.be.revertedWith("Growr. - loans are in progress");
			});

			it("Should not disburse loans if docId does not exists", async () => {
				await expect(Project.connect(paymentVerificatorAccount).disburseLoans(1000, "")).to.be.revertedWith(
					"Growr. - no loans found"
				);
			});

			it("Should not disburse loans if they are already canceled", async () => {
				await Project.connect(paymentVerificatorAccount).cancelLoans(loanToDisburse.docId);

				await expect(
					Project.connect(paymentVerificatorAccount).disburseLoans(loanToDisburse.docId, "")
				).to.be.revertedWith("Growr. - loans are in progress");
			});

			it("Should not disburse loans if the caller is not a whitelisted payment verificator", async () => {
				await expect(Project.connect(otherAccount).disburseLoans(loanToDisburse.docId, "")).to.be.revertedWith(
					"Growr. - payment verificator is not whitelisted"
				);
			});
		});
	});
});
