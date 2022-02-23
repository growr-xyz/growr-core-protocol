//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

library PondTypes {
    struct PondCriteria {
        string[] names;
        string[] types;
        string[] contents;
        string[] operations;
    }

    struct PondParams {
        string name;
        ERC20 token;
        uint256 minLoanAmount;
        uint256 maxLoanAmount;
        uint256 minLoanDuration;
        uint256 maxLoanDuration;
        uint256 annualInterestRate;
        uint256 disbursmentFee;
        uint256 cashBackRate;
    }
}
