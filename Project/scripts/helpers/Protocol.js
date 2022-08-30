async function attach(contractName, address) {
	const Contract = await ethers.getContractFactory(contractName);
	return await Contract.attach(address);
}

async function deployFactory() {
	const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
	return await ProjectFactory.deploy();
}

async function createProject(factory, params = {}, criteria = {}) {
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

	params = { ...defaultParams, ...params };
	criteria = { ...defaultCriteria, ...criteria };

	return await factory.createProject(params, criteria);
}

module.exports = {
	attach,
	deployFactory,
	createProject,
};
