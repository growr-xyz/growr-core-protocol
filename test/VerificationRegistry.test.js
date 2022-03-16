const { expect } = require("chai");
const { ethers } = require("hardhat");

const ContractHelper = require("../scripts/helpers/Contract");

const VALID_POND_ADDRESS = "0xa9efDEf197130B945462163a0B852019BA529a66";
const INVALID_POND_ADDRESS = "0x67832b9Fc47eb3CdBF7275b95a29740EC58193D2";

describe("Testing contract VerificationRegistry", function () {
	let registry, owner, verifier, verifier2, signer0;

	beforeEach(async () => {
		registry = await ContractHelper.deploy("VerificationRegistry");

		[owner, verifier, verifier2, signer0] = await ethers.getSigners();
	});

	describe("Managing verifiers", () => {
		it("Positive case - Should add verifier", async () => {
			await registry.addVerifier(verifier.address);
			const addedVerifier = await registry.getVerifier(verifier.address);

			expect(addedVerifier._verifier).to.equal(verifier.address);
			expect(await registry.getVerifiersCount()).to.equal(1);
			expect(await registry.owner()).to.equal(owner.address);
		});

		it("Positive case - Should remove verifier", async () => {
			await registry.addVerifier(verifier.address);

			expect(await registry.getVerifiersCount()).to.equal(1);

			await registry.removeVerifier(verifier.address);

			expect(await registry.getVerifiersCount()).to.equal(0);
		});

		it("Negative case - Should not add verifier if caller is not the owner", async () => {
			await expect(registry.connect(signer0).addVerifier(verifier.address)).to.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Negative case - Should not remove verifier if caller is not the owner", async () => {
			await registry.addVerifier(verifier.address);

			await expect(registry.connect(signer0).removeVerifier(verifier.address)).to.revertedWith(
				"Ownable: caller is not the owner"
			);
		});
	});

	describe("Managing verifications", () => {
		beforeEach(async () => {
			await registry.addVerifier(verifier.address);
			await registry.addVerifier(verifier2.address);
		});

		it("Positive case - Should register a verification", async () => {
			await registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60);

			const verification = await registry.getVerificationRecord(signer0.address);

			expect(verification._verifier).to.equal(verifier.address);
			expect(verification._object).to.equal(signer0.address);
			expect(verification._subject).to.equal(VALID_POND_ADDRESS);
		});

		it("Positive case - Should validate a verification", async () => {
			await registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60);
			const registered = await registry.validateVerification(signer0.address, VALID_POND_ADDRESS);

			expect(registered).to.equal(true);
		});

		it("Positive case - Should revoke a verification", async () => {
			await registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60);
			await registry.connect(verifier).revokeVerification(signer0.address);

			const registered = await registry.validateVerification(signer0.address, VALID_POND_ADDRESS);

			expect(registered).to.equal(false);
		});

		it("Negative case - Should not register a verification if caller is not verifier", async () => {
			await expect(registry.registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60)).to.revertedWith(
				"VerificationRegistry: Caller is not a Verifier"
			);
		});

		it("Negative case - Should not register a verification with invalid addresses", async () => {
			await expect(
				registry.connect(verifier).registerVerification(signer0.address, signer0.address, 5 * 60)
			).to.revertedWith("VerificationRegistry - Invalid addresses");
		});

		it("Negative case - Should not register a verification with 0 validity", async () => {
			await expect(
				registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 0)
			).to.revertedWith("VerificationRegistry - validity is too low");
		});

		it("Negative case - Should not revoke a verification regitered by other verifier", async () => {
			await registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60);

			await expect(registry.connect(verifier2).revokeVerification(signer0.address)).to.revertedWith(
				"VerificationRegistry - Incorrect verifier"
			);
		});

		it("Negative case - Should not validate a verification with invalid subject", async () => {
			await registry.connect(verifier).registerVerification(signer0.address, VALID_POND_ADDRESS, 5 * 60);
			const validated = await registry.validateVerification(signer0.address, INVALID_POND_ADDRESS);

			expect(validated).to.equal(false);
		});
	});
});
