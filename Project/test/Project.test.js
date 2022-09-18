const { expect } = require("chai");

const { deployFactory, createProject } = require("../scripts/helpers/Protocol");

describe.only("Project.sol", function () {
	let Factory, Project, ownerAccount, verificatorAccount, otherAccount;

	this.beforeAll(async () => {
		[ownerAccount, verificatorAccount, otherAccount] = await ethers.getSigners();

		Factory = await deployFactory();
		Project = await createProject(Factory, { id: "project-1234" });
	});

	describe("Whitelist verificator", function () {
		describe("Positive suites", () => {
			it("Should add verificator", async () => {
				const verificatorBefore = await Project.verificators(verificatorAccount.address);

				const tx = await Project.addVerificator(verificatorAccount.address);
				await tx.wait();

				const verificatorAfter = await Project.verificators(verificatorAccount.address);

				expect(verificatorBefore).to.be.false;
				expect(verificatorAfter).to.be.true;
			});

			it("Should remove verificator", async () => {
				const verificatorBefore = await Project.verificators(verificatorAccount.address);

				const tx = await Project.removeVerificator(verificatorAccount.address);
				await tx.wait();

				const verificatorAfter = await Project.verificators(verificatorAccount.address);

				expect(verificatorBefore).to.be.true;
				expect(verificatorAfter).to.be.false;
			});
		});

		describe("Negative suites", () => {
			it("Should not add verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).addVerificator(verificatorAccount.address)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not remove verificator if not the owner", async () => {
				await expect(
					Project.connect(otherAccount).removeVerificator(verificatorAccount.address)
				).to.be.revertedWith("Ownable: caller is not the owner");
			});

			it("Should not add verificator if project is deactivated", async () => {
				const tx = await Factory.changeProjectStatus(Project.address, false);
				await tx.wait();

				await expect(Project.addVerificator(verificatorAccount.address)).to.be.revertedWith(
					"Growr. - project is deactivated"
				);
			});

			it("Should not remove verificator if project is deactivated", async () => {
				const tx = await Factory.changeProjectStatus(Project.address, false);
				await tx.wait();

				await expect(Project.removeVerificator(verificatorAccount.address)).to.be.revertedWith(
					"Growr. - project is deactivated"
				);
			});
		});
	});
});
