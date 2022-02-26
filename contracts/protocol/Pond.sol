//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

import "./Pond.sol";
import "./CredentialVerifier.sol";
import "../libraries/types/Types.sol";

contract Pond is Ownable, CredentialVerifier {
    using SafeMath for uint256;

    Types.PondParams private params;

    mapping(address => uint256) public getDepositorBalance;

    uint256 public totalDeposited;
    uint256 public totalUtilized;
    uint256 public accruedInterest;

    bool public active;

    modifier notClosed() {
        require(active, "Growr. - Pond is not active anymore");
        _;
    }

    constructor(
        Types.PondParams memory _params,
        Types.PondCriteriaInput memory _criteria
    ) CredentialVerifier(_criteria) {
        active = true;
        params = _params;
    }

    function getAvailableBalance() private view returns (uint256) {
        return
            params.token.balanceOf(address(this)).sub(totalUtilized).sub(
                accruedInterest
            );
    }

    function getDetails()
        public
        view
        returns (
            Types.PondParams memory _params,
            Types.PondCriteria[] memory _criteria,
            uint256 _totalDeposited,
            uint256 _totalUtilized
        )
    {
        return (params, criteria, totalDeposited, totalUtilized);
    }

    /**
        Checks if the user is eligible for borrowing a loan.
        If some of the input params are not in the pond capabilities,
        it returns the most suitable loan the user can borrow at that time
     */
    function getLoanOffer(
        uint256 _amount,
        uint256 _duration,
        Types.PersonalCredentialsInput memory _credentials
    ) external view notClosed returns (Types.LoanOffer memory _loan) {
        uint256 amount = _amount;
        uint256 duration = _duration;
        // get most suitable loan amount
        if (amount < params.minLoanAmount) amount = params.minLoanAmount;
        else if (amount > params.maxLoanAmount) amount = params.maxLoanAmount;

        // get most suitable loan duration
        if (duration < params.minLoanDuration)
            duration = params.minLoanDuration;
        else if (duration > params.maxLoanDuration)
            duration = params.maxLoanDuration;

        bool eligible = verifyCredentials(_credentials);

        // check available balance
        uint256 balance = getAvailableBalance();
        if (balance <= 0) eligible = false;
        if (amount > balance) amount = balance;

        _loan = Types.LoanOffer(
            false,
            amount,
            duration,
            params.annualInterestRate,
            params.disbursmentFee,
            params.cashBackRate,
            0,
            0,
            0
        );

        if (eligible) {
            _loan.approved = true;
            _loan.interestAmount = amount.add(
                amount.mul(params.annualInterestRate).mul(duration).div(12)
            );
            _loan.repayAmount = amount.add(_loan.interestAmount);
            _loan.installmentAmount = _loan.repayAmount.div(duration);
        }

        return _loan;
    }

    function deposit(uint256 amount) external notClosed {
        totalDeposited = totalDeposited.add(amount);
        getDepositorBalance[msg.sender] = getDepositorBalance[msg.sender].add(
            amount
        );

        params.token.transferFrom(msg.sender, address(this), amount);
    }
}
