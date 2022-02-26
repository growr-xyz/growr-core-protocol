const { ethers } = require("hardhat");

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

module.exports = (factory, xUSD) => {
	return {
		defaultParams,
		defaultCriteria,
		createPond: async (_params, _criteria) => {
			_params = {
				...defaultParams,
				token: xUSD.address,
				..._params,
			};
			_criteria = {
				...defaultCriteria,
				..._criteria,
			};

			return await factory.createPond(
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
};
