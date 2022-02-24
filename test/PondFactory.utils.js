const { ethers } = require("hardhat");

const defaultParams = {
	name: "Pond 1",
	token: null,
	minLoanAmount: 100,
	maxLoanAmount: 500,
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
	operations: ["="],
};

module.exports = (factory, xUSD) => {
	return {
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
					minLoanAmount: ethers.utils.parseUnits(_params.minLoanAmount.toString(), "ether"),
					maxLoanAmount: ethers.utils.parseUnits(_params.maxLoanAmount.toString(), "ether"),
					minLoanDuration: ethers.utils.parseUnits(_params.minLoanDuration.toString(), "ether"),
					maxLoanDuration: ethers.utils.parseUnits(_params.maxLoanDuration.toString(), "ether"),
					annualInterestRate: ethers.utils.parseUnits(_params.annualInterestRate.toString(), "ether"),
					disbursmentFee: ethers.utils.parseUnits(_params.disbursmentFee.toString(), "ether"),
					cashBackRate: ethers.utils.parseUnits(_params.cashBackRate.toString(), "ether"),
				},
				_criteria
			);
		},
	};
};
