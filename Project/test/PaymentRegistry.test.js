const { expect } = require("chai");

describe.only("PaymentRegistry.sol", function () {
	let PaymentRegistry, factoryAccount, ownerAccount, adminAccount, hackerAccount;

	const fakeProjectAddress = "0x0000000000000000000000000000000000000010";

	this.beforeAll(async () => {
		[factoryAccount, ownerAccount, adminAccount, hackerAccount] = await ethers.getSigners();

		const ContractFactory = await ethers.getContractFactory("PaymentRegistry");
		PaymentRegistry = await ContractFactory.deploy();
	});

	describe("Simulate Factory contract", () => {
		describe("Positive suites", () => {
			it("Should verify factory address", async () => {
				const factory = await PaymentRegistry.factory();

				expect(factory).to.equal(factoryAccount.address);
			});

			it("Should add project owner", async () => {
				const tx = await PaymentRegistry.addOwner(fakeProjectAddress, ownerAccount.address);
				const receipt = await tx.wait();

				const ownerRole = await PaymentRegistry.getRole(fakeProjectAddress, ownerAccount.address);

				const { projectAddress, user, updatedRole } = receipt.events.filter((e) => e.event === "RoleUpdated")[0]
					.args;

				expect(ownerRole.isOwner).to.be.true;
				expect(ownerRole.isAdmin).to.be.true;
				expect(updatedRole.isOwner).to.be.true;
				expect(updatedRole.isAdmin).to.be.true;
				expect(user).to.equal(ownerAccount.address);
				expect(projectAddress).to.equal(fakeProjectAddress);
			});
		});

		describe("Negative suites", () => {
			it("Should not verify factory address", async () => {
				const factory = await PaymentRegistry.factory();

				expect(factory).to.not.equal(ownerAccount.address);
			});

			it("Should not add owner if it's not the factory", async () => {
				await expect(
					PaymentRegistry.connect(hackerAccount).addOwner(fakeProjectAddress, ownerAccount.address)
				).to.be.revertedWith("Growr. - access denied");
			});
		});
	});

	describe("Update admin role", () => {
		describe("Positive suites", () => {
			it("Should set project admin", async () => {
				const tx = await PaymentRegistry.connect(ownerAccount).updateAdmin(
					fakeProjectAddress,
					adminAccount.address,
					true
				);
				const receipt = await tx.wait();

				const adminRole = await PaymentRegistry.getRole(fakeProjectAddress, adminAccount.address);

				const { projectAddress, user, updatedRole } = receipt.events.filter((e) => e.event === "RoleUpdated")[0]
					.args;

				expect(adminRole.isOwner).to.be.false;
				expect(adminRole.isAdmin).to.be.true;
				expect(updatedRole.isOwner).to.be.false;
				expect(updatedRole.isAdmin).to.be.true;
				expect(user).to.equal(adminAccount.address);
				expect(projectAddress).to.equal(fakeProjectAddress);
			});

			it("Should remove project admin", async () => {
				const tx = await PaymentRegistry.connect(ownerAccount).updateAdmin(
					fakeProjectAddress,
					adminAccount.address,
					false
				);
				const receipt = await tx.wait();

				const adminRole = await PaymentRegistry.getRole(fakeProjectAddress, adminAccount.address);

				const { projectAddress, user, updatedRole } = receipt.events.filter((e) => e.event === "RoleUpdated")[0]
					.args;

				expect(adminRole.isOwner).to.be.false;
				expect(adminRole.isAdmin).to.be.false;
				expect(updatedRole.isOwner).to.be.false;
				expect(updatedRole.isAdmin).to.be.false;
				expect(user).to.equal(adminAccount.address);
				expect(projectAddress).to.equal(fakeProjectAddress);
			});
		});

		describe("Negative suites", () => {
			it("Should not set project admin", async () => {
				await expect(
					PaymentRegistry.connect(hackerAccount).updateAdmin(fakeProjectAddress, adminAccount.address, true)
				).to.be.revertedWith("Growr. - access denied");
			});

			it("Should not remove project admin", async () => {
				await expect(
					PaymentRegistry.connect(hackerAccount).updateAdmin(fakeProjectAddress, adminAccount.address, false)
				).to.be.revertedWith("Growr. - access denied");
			});
		});
	});
});
