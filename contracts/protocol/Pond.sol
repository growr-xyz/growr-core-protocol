//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

import "./Pond.sol";
import "./Loan.sol";
import "./CredentialVerifier.sol";
import "../libraries/types/Types.sol";

contract Pond is Ownable, CredentialVerifier {
    using SafeMath for uint256;

    Types.PondParams private params;

    mapping(address => uint256) public getLenderBalance;
    mapping(address => Loan) public getLoan;

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
            _loan.interestAmount = amount
                .mul(params.annualInterestRate)
                .mul(duration)
                .div(100)
                .div(12);
            _loan.totalAmount = amount.add(_loan.interestAmount);
            _loan.installmentAmount = _loan.totalAmount.div(duration);
        }

        return _loan;
    }

    function deposit(uint256 amount) external notClosed {
        totalDeposited = totalDeposited.add(amount);
        getLenderBalance[msg.sender] = getLenderBalance[msg.sender].add(amount);

        params.token.transferFrom(msg.sender, address(this), amount);
    }

    function borrow(uint256 _amount, uint256 _duration) public {
        require(
            _amount >= params.minLoanAmount,
            "Growr.- Amount is less than min loan amount"
        );
        require(
            _amount <= params.maxLoanAmount,
            "Growr. - Amount exceeds max loan amount"
        );
        require(
            _amount <= getAvailableBalance(),
            "Growr. - Not enough funds to borrow"
        );
        require(
            _duration >= params.minLoanDuration,
            "Growr. - Duration is less than min loan duration"
        );
        require(
            _duration <= params.maxLoanDuration,
            "Growr. - Duration exceeds max loan duration"
        );

        // Get personal credentials and verify them with the pond criteria
        // Types.PersonalCredentialsInput memory _credentials = PersonalCredentials(msg.sender);
        bool eligible = true; //verifyCredentials(_credentials);

        require(eligible, "Growr. - Eligibility verificaiton failed");

        totalUtilized.add(_amount);

        getLoan[msg.sender] = new Loan(
            params.token,
            _amount,
            _duration,
            params.annualInterestRate,
            params.disbursmentFee,
            params.cashBackRate
        );

        params.token.transfer(msg.sender, _amount);
    }

    function repay(uint256 _amount, address _loan) external {
        Loan loan = getLoan[msg.sender];

        require(address(loan) == _loan, "Growr. - Loan does not exists");

        // uint interestAmount = loan.interestAmount();
        // uint256 remainingInterest = interestAmount.sub(
        //     loan.repaidInterestAmount()
        // );
        // console.log(interestAmount, loan.repaidInterestAmount());
        // uint256 remainingPrincipal = _amount.sub(remainingInterest);

        // totalUtilized = totalUtilized.sub(remainingPrincipal);

        loan.repay(_amount);

        params.token.transferFrom(msg.sender, address(this), _amount);
    }
}
