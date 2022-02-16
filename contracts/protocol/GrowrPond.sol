//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GrowrPond {
    using SafeMath for uint256;

    PondStats public pond;
    mapping(address => uint256) public getLenderAccInterest;
    mapping(address => uint256) public getLenderBalance;
    mapping(address => uint256) public getLenderIndex;
    mapping(address => LoanStats) public getLoan;

    address[] public lenders;

    struct PondStats {
        string name;
        // address of the lending token
        IERC20 token;
        // the percentage rate the borrower has to pay to lenders per year
        uint256 disbursementFee;
        // the lowest credit score eligible for taking a loan
        uint256 minCreditRating;
        // max amount of all tokens that will be ever deposited
        uint256 maxPondSize;
        // min amount of loan the borrower could take
        uint256 minLoanSize;
        // max amount of loan the borrower could take
        uint256 maxLoanSize;
        // current total amount of already deposited tokens
        uint256 totalPondSize;
    }
    struct LoanStats {
        IERC20 token;
        uint256 issuedAt;
        uint256 totalDebt;
        uint256 principal;
        uint256 lastDisbursedAt;
        uint256 repaidInterest;
        bool exists;
        // TODO: status?
    }

    // event PondDeposit(address depositor, uint256 amount);

    constructor(
        string memory _name,
        IERC20 _token,
        uint256 _disbursementFee,
        uint256 _minCreditRating,
        uint256 _maxPondSize,
        uint256 _minLoanSize,
        uint256 _maxLoanSize
    ) {
        pond = PondStats(
            _name,
            _token,
            _disbursementFee,
            _minCreditRating,
            _maxPondSize,
            _minLoanSize,
            _maxLoanSize,
            0
        );

        // reserve the first index of fee distribution list
        // for easy tracking of new lenders
        lenders.push(address(this));
    }

    function getLenderStats(address _lender)
        public
        view
        returns (
            uint256 principal,
            uint256 accruedInterest,
            uint256 currentShare,
            uint256 minShare
        )
    {
        principal = getLenderBalance[_lender];
        accruedInterest = getLenderAccInterest[_lender];

        return (
            principal,
            accruedInterest,
            principal > 0 ? principal.mul(100).div(pond.totalPondSize) : 0,
            principal > 0 ? principal.mul(100).div(pond.maxPondSize) : 0
        );
    }

    function getBorrowerStats(address _borrower)
        public
        view
        returns (LoanStats memory, uint256 accruedInterest)
    {
        LoanStats memory loan = getLoan[_borrower];

        uint256 interestPeriodInSeconds = block.timestamp -
            loan.lastDisbursedAt;
        uint256 secondsPerYear = 60 * 60 * 24 * 365;

        // convert APR to interest rate per second
        // convert from %
        // substracts already repaid interest
        accruedInterest = loan
            .principal
            .mul(interestPeriodInSeconds)
            .mul(pond.disbursementFee)
            .div(secondsPerYear)
            .div(100)
            .sub(loan.repaidInterest);

        return (loan, accruedInterest);
    }

    function deposit(uint256 _amount) public {
        require(
            pond.totalPondSize.add(_amount) <= pond.maxPondSize,
            "Deposit amount exceeds the max amount"
        );

        pond.totalPondSize = pond.totalPondSize.add(_amount);
        getLenderBalance[msg.sender] = getLenderBalance[msg.sender].add(
            _amount
        );

        // if lender deposits for the very first time, add it to fee distribution list
        if (getLenderIndex[msg.sender] == 0) {
            lenders.push(msg.sender);
            getLenderIndex[msg.sender] = lenders.length - 1;
        }
        // if lender joins back, just update its fee distribution index
        if (lenders[getLenderIndex[msg.sender]] == address(0)) {
            lenders[getLenderIndex[msg.sender]] = msg.sender;
        }

        pond.token.transferFrom(msg.sender, address(this), _amount);

        // emit PondDeposit(msg.sender, _amount);
    }

    function withdraw(uint256 _wPrincipal, uint256 _wInterest) public {
        (uint256 principal, uint256 accruedInterest, , ) = getLenderStats(
            msg.sender
        );
        require(_wPrincipal <= principal, "Principal not enough");
        require(_wInterest <= accruedInterest, "Accrued interest not enough");
        require(
            _wPrincipal.add(_wInterest) <= pond.maxPondSize,
            "Withdraw amount exceeds max amount"
        );
        // check if there are enough funds to withdraw
        require(
            _wPrincipal.add(_wInterest) <= pond.token.balanceOf(address(this)),
            "Withdraw amount exceeds current amount"
        );

        // withdraw principal
        if (_wPrincipal > 0) {
            pond.totalPondSize = pond.totalPondSize.sub(_wPrincipal);
            getLenderBalance[msg.sender] = principal.sub(_wPrincipal);
            pond.token.transfer(msg.sender, _wPrincipal);
        }
        // withdraw accrued interest
        if (_wInterest > 0) {
            getLenderAccInterest[msg.sender] = accruedInterest.sub(_wInterest);
            pond.token.transfer(msg.sender, _wInterest);
        }

        // remove lender from the fee distribution list
        // if he is out of the pond

        if (getLenderBalance[msg.sender] <= 0) {
            delete lenders[getLenderIndex[msg.sender]];
        }
    }

    function borrow(uint256 _amount) public {
        // TODO:
        // require(CreditRating(msg.sender).rating() > pond.minCreditRating, "You are not eligible to get loans");
        require(
            _amount >= pond.minLoanSize && _amount <= pond.maxLoanSize,
            "Loan amount out of range"
        );
        require(
            _amount <= pond.totalPondSize,
            "Borrow amount exceeds total amount"
        );
        // TODO: check for max

        (LoanStats memory loan, ) = getBorrowerStats(msg.sender);

        if (!loan.exists) {
            loan = LoanStats({
                token: pond.token,
                issuedAt: block.timestamp,
                totalDebt: 0,
                principal: 0,
                lastDisbursedAt: block.timestamp,
                repaidInterest: 0,
                exists: true
            });
        }

        loan.principal = loan.principal.add(_amount);
        loan.totalDebt = loan.totalDebt.add(_amount);

        getLoan[msg.sender] = loan;
    }

    function repay(uint256 _amount) public {
        (LoanStats memory loan, uint256 accruedInterest) = getBorrowerStats(
            msg.sender
        );

        require(loan.exists, "You have nothing to pay for");
        require(
            _amount <= loan.totalDebt.add(accruedInterest),
            "Loan cannot be overpaid"
        );

        uint256 repayInterestAmount = _amount <= accruedInterest
            ? _amount
            : accruedInterest;

        uint256 repayPrincipalAmount = _amount.sub(repayInterestAmount);
        pond.token.transferFrom(msg.sender, address(this), _amount);

        // distribute accrued interest from index 1, cuz index 0 is reserved by the Pond
        // but its not a part of the distribution list
        for (uint256 i = 1; i < lenders.length; i++) {
            address lender = lenders[i];
            if (lender == address(0)) continue;

            (, , uint256 lenderCurrentShare, ) = getLenderStats(lender);

            console.log(
                getLenderAccInterest[lender].add(
                    repayInterestAmount.mul(lenderCurrentShare).div(100)
                )
            );

            getLenderAccInterest[lender] = getLenderAccInterest[lender].add(
                repayInterestAmount.mul(lenderCurrentShare).div(100)
            );
        }

        //
        loan.repaidInterest = loan.repaidInterest.add(repayInterestAmount);

        // once accrued interest is fully repaid
        if (repayPrincipalAmount > 0) {
            loan.principal = loan.principal.sub(repayPrincipalAmount);
            loan.lastDisbursedAt = block.timestamp;
            loan.repaidInterest = 0;
        }
        getLoan[msg.sender] = loan;
    }
}
