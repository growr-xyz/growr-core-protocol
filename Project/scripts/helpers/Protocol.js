const { getVerificatorSignature, getBorrowerSignature } = require("./Utils");

async function attach(contractName, address) {
	const Contract = await ethers.getContractFactory(contractName);
	return await Contract.attach(address);
}

async function deployFactory() {
	const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
	return await ProjectFactory.deploy();
}

const LoanStatus = {
	CREATED: 0,
	DISBURSED: 1,
	CANCELED: 2,
	REPAYED: 3,
};

const VerificatorType = {
	CREDENTIAL: 0,
	PAYMENT: 1,
};

const ONE_MONTH_IN_SECONDS = 2592000; // 30 * 24 * 60 * 60

const defaultParams = {
	id: "project-" + Math.floor(Math.random() * 1000000),
	name: "Project 1",
	startDate: Math.floor(Date.now() / 1000),
	endDate: Math.floor(Date.now() / 1000) + ONE_MONTH_IN_SECONDS,
	amount: 10_000,
	interestRate: 15,
	cashbackRate: 5,
	gracePeriod: 7,
};

const defaultCriteria = {
	names: ["citizenship"],
	types: ["string"],
	contents: ["AL"],
	operators: ["="],
};

async function createProject(factory, params = {}, criteria = {}) {
	params = { ...defaultParams, ...params };
	criteria = { ...defaultCriteria, ...criteria };

	const tx = await factory.createProject(params, criteria);
	const receipt = await tx.wait();

	const args = receipt.events.filter((e) => e.event === "ProjectCreated")[0].args;

	return await attach("Project", args.projectAddress);
}

async function createLoans(Project, borrowerAccount, verificatorAccount, amount, docId) {
	amount = amount || 500;
	docId = docId || 1;
	const borrower = borrowerAccount.address;
	const verificatorSignature = await getVerificatorSignature(verificatorAccount, borrower, amount, docId);
	const borrowerSignature = await getBorrowerSignature(borrowerAccount, verificatorSignature);

	const tx = await Project.createLoans([borrower], [amount], [borrowerSignature], [verificatorSignature], docId);
	const receipt = await tx.wait();

	const args = receipt.events.filter((e) => e.event === "LoanCreated")[0].args;

	return {
		...args,
	};
}

module.exports = {
	attach,
	deployFactory,
	createProject,
	createLoans,
	defaultCriteria,
	defaultParams,
	LoanStatus,
	VerificatorType,
};
