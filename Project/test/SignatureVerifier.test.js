const { expect } = require("chai");

describe("SignatureVerifier.sol", function () {
	let Verifier, signerAccount, otherAccount;

	const message = "just a string";
	const messageHash = ethers.utils.solidityKeccak256(["string"], [message]);
	const messageHashBytes = ethers.utils.arrayify(messageHash);

	this.beforeAll(async () => {
		[signerAccount, otherAccount] = await ethers.getSigners();

		const VerifierContract = await ethers.getContractFactory("SignatureVerifier");
		Verifier = await VerifierContract.deploy();
	});

	describe("Verify Signature", () => {
		describe("Positive suites", () => {
			it("Should verify signer's signature", async () => {
				const signature = await signerAccount.signMessage(messageHashBytes);

				const verified = await Verifier.verifySigner(signerAccount.address, messageHash, signature);

				expect(verified).to.be.true;
			});
		});

		describe("Negative suites", () => {
			it("Should not verify other's signature", async () => {
				const signature = await signerAccount.signMessage(messageHashBytes);

				const verified = await Verifier.verifySigner(otherAccount.address, messageHash, signature);

				expect(verified).to.be.false;
			});

			it("Should not verify fake message", async () => {
				const signature = await signerAccount.signMessage(messageHashBytes);

				const fakeMessage = "it's not just a string";
				const fakeMessageHash = ethers.utils.solidityKeccak256(["string"], [fakeMessage]);

				const verified = await Verifier.verifySigner(signerAccount.address, fakeMessageHash, signature);

				expect(verified).to.be.false;
			});
		});
	});
});
