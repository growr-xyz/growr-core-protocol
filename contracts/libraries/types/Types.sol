//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

library Types {
    struct PersonalCredentialsInput {
        string[] names;
        string[] contents;
    }

    struct PondCriteriaInput {
        string[] names;
        string[] types;
        string[] contents;
        string[] operators;
    }

    struct PondCriteria {
        bool _exists;
        string _name;
        string _type;
        string _content;
        string _operator;
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

    struct LoanOffer {
        bool approved;
        uint256 amount;
        uint256 duration;
        uint256 annualInterestRate;
        uint256 disbursmentFee;
        uint256 cashBackRate;
        uint256 interestAmount;
        uint256 repayAmount;
        uint256 installmentAmount;
    }
}
