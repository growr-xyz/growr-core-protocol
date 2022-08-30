const hre = require("hardhat");

const ContractHelper = require("./Contract");

const defaultParams = {
	name: "Pond 1",
	token: null,
	minLoanAmount: ethers.utils.parseUnits("100", "ether"),
	maxLoanAmount: ethers.utils.parseUnits("500", "ether"),
	minLoanDuration: 1,
	maxLoanDuration: 12,
	annualInterestRate: 20,
	disbursmentFee: 5,
	cashBackRate: 5,
};
const defaultCriteria = {
	names: ["citizenship"],
	types: ["string"],
	contents: ["SV"],
	operators: ["="],
};

module.exports.defaultParams = defaultParams;
module.exports.defaultCriteria = defaultCriteria;

module.exports.deploy = async function (...params) {
	const Contract = await ContractHelper.deploy("PondFactory", ...params);

	await Contract.deployed();

	Contract.helpers = {
		createPond: async (_params, _criteria) => {
			_params = {
				...defaultParams,
				..._params,
			};
			_criteria = {
				...defaultCriteria,
				..._criteria,
			};

			return await Contract.createPond(
				{
					name: _params.name,
					token: _params.token,
					minLoanAmount: _params.minLoanAmount,
					maxLoanAmount: _params.maxLoanAmount,
					minLoanDuration: _params.minLoanDuration,
					maxLoanDuration: _params.maxLoanDuration,
					annualInterestRate: _params.annualInterestRate,
					disbursmentFee: _params.disbursmentFee,
					cashBackRate: _params.cashBackRate,
				},
				_criteria
			);
		},
	};

	return Contract;
};
