const { expect } = require("chai");

const { getBorrowerSignature, getVerificatorSignature } = require("../scripts/helpers/Utils");

describe("SignatureVerifier.sol", function () {
	let Verifier, borrowerAccount, verificatorAccount;

	const message = "just a string";
	const messageHash = ethers.utils.solidityKeccak256(["string"], [message]);
	const messageHashBytes = ethers.utils.arrayify(messageHash);

	this.beforeAll(async () => {
		[borrowerAccount, verificatorAccount] = await ethers.getSigners();

		const VerifierContract = await ethers.getContractFactory("SignatureVerifier");
		Verifier = await VerifierContract.deploy();
	});

	describe("Verify Signature", () => {
		describe("Positive suites", () => {
			it("Should verify signer's signature", async () => {
				const signature = await borrowerAccount.signMessage(messageHashBytes);

				const verified = await Verifier.verifySigner(borrowerAccount.address, messageHash, signature);

				expect(verified).to.be.true;
			});

			it("Should verify borrower's signature", async () => {
				const amount = 500;
				const docId = 1;

				const signature = await getBorrowerSignature(borrowerAccount, amount, docId);

				const verified = await Verifier.verifyBorrowerSignature(
					amount,
					docId,
					borrowerAccount.address,
					signature
				);

				expect(verified).to.be.true;
			});

			it("Should verify verificator's signature", async () => {
				const amount = 500;
				const docId = 1;

				const borrowerSignature = await getBorrowerSignature(borrowerAccount, amount, docId);
				const verificatorSignature = await getVerificatorSignature(verificatorAccount, borrowerSignature);

				const verificator = await Verifier.recoverVerificatorAddress(borrowerSignature, verificatorSignature);

				expect(verificator).to.be.equal(verificatorAccount.address);
			});
		});

		describe("Negative suites", () => {
			it("Should not verify other's signature", async () => {
				const signature = await borrowerAccount.signMessage(messageHashBytes);

				const verified = await Verifier.verifySigner(verificatorAccount.address, messageHash, signature);

				expect(verified).to.be.false;
			});

			it("Should not verify fake message", async () => {
				const signature = await borrowerAccount.signMessage(messageHashBytes);

				const fakeMessage = "it's not just a string";
				const fakeMessageHash = ethers.utils.solidityKeccak256(["string"], [fakeMessage]);

				const verified = await Verifier.verifySigner(borrowerAccount.address, fakeMessageHash, signature);

				expect(verified).to.be.false;
			});
		});
	});
});
