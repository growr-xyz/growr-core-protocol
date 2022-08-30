const { expect } = require("chai");

const { attach, deployFactory, createProject } = require("../scripts/helpers/Protocol");


describe("ProjectFactory", function () {
	let Factory, deployerAccount, otherAccount1;

	this.beforeAll(async () => {
		[deployerAccount, otherAccount1] = await ethers.getSigners();

		Factory = await deployFactory();
	});

	describe("Create Project", function () {
		let projectAddress, projectContract;

		describe("Positive suites", () => {
			it("Should create a new project", async function () {
				const projectId = "project-123";

				const tx = await createProject(Factory, { id: projectId });
				const receipt = await tx.wait();

				const args = receipt.events.filter((e) => e.event === "ProjectCreated")[0].args;

				const numberOfProjects = await Factory.getProjectsLength(deployerAccount.address);

				projectAddress = args.projectAddress;
				projectContract = await attach("Project", projectAddress);

				expect(args.projectId).to.equal(projectId);
				expect(args.projectOwner).to.equal(deployerAccount.address);
				expect(numberOfProjects).to.equal(1);
			});

			it("Should deactivate project", async () => {
				await Factory.changeProjectStatus(projectAddress, false);

				const active = await projectContract.active();

				expect(active).to.equal(false);
			});

			it("Should activate project", async () => {
				await Factory.changeProjectStatus(projectAddress, true);

				const active = await projectContract.active();

				expect(active).to.equal(true);
			});
		});

		describe("Negative suites", () => {
			it("Should revert for invalid project name", async function () {
				await expect(createProject(Factory, { name: "" })).to.be.revertedWith("Agrifin - Invalid project name");
			});

			it("Should revert for invalid project criteria", async function () {
				await expect(createProject(Factory, {}, { names: [] })).to.be.revertedWith(
					"Agrifin - Invalid project criteria"
				);
			});

			it("Should revert on deactivate if caller is not the owner", async function () {
				await expect(
					Factory.connect(otherAccount1).changeProjectStatus(projectAddress, false)
				).to.be.revertedWith("Agrifin - Caller is not the owner");
			});

			it("Should revert on activate if caller is not the owner", async function () {
				await expect(
					Factory.connect(otherAccount1).changeProjectStatus(projectAddress, true)
				).to.be.revertedWith("Agrifin - Caller is not the owner");
			});
		});
	});
});
