//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

import "../libraries/types/Types.sol";
import "../libraries/utils/DateTime.sol";

contract Loan {
    using SafeMath for uint256;
    using Math for uint256;

    address public pond;

    Types.LoanParams private params;

    uint256 public interestAmount; // monthly interest amount
    uint256 public totalInterestAmount; // total interest amount for the whole period
    uint256 public totalAmount; // total loan amount + interest
    uint256 public installmentAmount; // amount to be paid every month
    uint256 public repaidTotalAmount; // already repaid total amount + interest
    uint256 public repaidInterestAmount; // already repaid interest
    uint256 public issuedAt; // timestamp when the loan is issued

    modifier onlyPond() {
        require(msg.sender == pond, "Growr. - Access denied");
        _;
    }

    constructor(
        ERC20 _token,
        uint256 _amount,
        uint256 _duration,
        uint256 _annualInterestRate,
        uint256 _disbursmentFee,
        uint256 _cashBackRate
    ) {
        pond = msg.sender;
        issuedAt = block.timestamp;

        totalInterestAmount = _amount
            .mul(_annualInterestRate)
            .mul(100)
            .mul(_duration)
            .div(10000)
            .div(12);
        totalAmount = _amount.add(totalInterestAmount);

        installmentAmount = totalAmount.div(_duration);
        interestAmount = totalInterestAmount.div(_duration);

        params = Types.LoanParams({
            token: _token,
            amount: _amount,
            duration: _duration,
            annualInterestRate: _annualInterestRate,
            disbursmentFee: _disbursmentFee,
            cashBackRate: _cashBackRate
        });
    }

    /**
        counts how many months have passed from the beginning to the present
     */
    function getElapsedDuration() internal view returns (uint256) {
        /*
            DateTime.addDays(DateTime.addMonths(block.timestamp, 1), 1);
            DateTime.subDays(DateTime.addMonths(block.timestamp, 1), 1);
        */

        uint256 _now = block.timestamp;
        uint256 elapsedDuration = DateTime.diffMonths(issuedAt, _now);

        // calculates the exact elapsed months to the current day
        if (
            DateTime.getDay(issuedAt) >= DateTime.getDay(_now) &&
            elapsedDuration > 0
        ) {
            elapsedDuration = elapsedDuration.sub(1);
        }

        return elapsedDuration;
    }

    function getNextInstallment2()
        internal
        view
        returns (
            uint256 _nextInstallmentDate,
            uint256 _nextInstallmentAmount,
            uint256 _nextInstallmentInterest
        )
    {
        _nextInstallmentAmount = repaidTotalAmount == 0 ? installmentAmount : 0;
        _nextInstallmentInterest = repaidInterestAmount == 0
            ? interestAmount
            : 0;

        uint256 elapsedDuration = getElapsedDuration();
        // calculates the minimum amount + interest that needs to be paid so far
        uint256 expectedAmount = installmentAmount.mul(elapsedDuration);
        uint256 expectedInterest = interestAmount.mul(elapsedDuration);
        // if the loan is overdue, add the missing amount to next installment
        if (expectedAmount > repaidTotalAmount) {
            _nextInstallmentAmount = expectedAmount.sub(repaidTotalAmount);
        }
        // if the loan is overdue, add the missing interest to next installment
        if (expectedInterest > repaidInterestAmount) {
            _nextInstallmentInterest = expectedInterest.sub(
                repaidInterestAmount
            );
        }

        // if the loan is prematured, substract the extra amount from next installment amount
        if (repaidTotalAmount > expectedAmount) {
            uint256 repaidInstallments = repaidTotalAmount.div(
                installmentAmount
            );
            uint256 repaidExtra = repaidTotalAmount.sub(
                installmentAmount.mul(repaidInstallments)
            );
            uint256 remainingAmount = totalAmount.sub(repaidTotalAmount);

            _nextInstallmentAmount = remainingAmount > installmentAmount
                ? installmentAmount.sub(repaidExtra)
                : remainingAmount;
        }

        return (
            _nextInstallmentDate,
            _nextInstallmentAmount,
            _nextInstallmentInterest
        );
    }

    // TODO: refactor
    function getNextInstallment()
        internal
        view
        returns (
            uint256 _nextInstallmentDate,
            uint256 _nextInstallmentAmount,
            uint256 _nextInstallmentInterest
        )
    {
        uint256 elapsedDuration = getElapsedDuration();

        _nextInstallmentAmount = installmentAmount;
        _nextInstallmentInterest = interestAmount;
        // uint256 elapsedDuration = getElapsedDuration();
        uint256 repaidInstallments = elapsedDuration;
        // calculates the minimum amount + interest that needs to be paid so far
        uint256 expectedAmount = installmentAmount.mul(elapsedDuration);
        uint256 expectedInterest = interestAmount.mul(elapsedDuration);

        // if the loan is overdue, add the missing amount to next installment
        if (expectedAmount > repaidTotalAmount) {
            _nextInstallmentAmount = expectedAmount.sub(repaidTotalAmount);
        }
        // if the loan is prematured, substract the extra amount from next installment amount
        if (repaidTotalAmount > expectedAmount) {
            repaidInstallments = repaidTotalAmount.div(installmentAmount);
            uint256 repaidExtra = repaidTotalAmount.sub(
                installmentAmount.mul(repaidInstallments)
            );
            uint256 remainingAmount = totalAmount.sub(repaidTotalAmount);

            _nextInstallmentAmount = remainingAmount > installmentAmount
                ? installmentAmount.sub(repaidExtra)
                : remainingAmount;
        }

        // if the loan is overdue, add the missing interest to next installment
        if (expectedInterest > repaidInterestAmount) {
            _nextInstallmentInterest = expectedInterest.sub(
                repaidInterestAmount
            );
        }
        // if the loan is prematured, substract the extra interest from next installment
        if (repaidInterestAmount > expectedInterest) {
            uint256 repaidExtra = repaidInterestAmount.sub(
                interestAmount.mul(repaidInterestAmount.div(interestAmount))
            );

            uint256 remainingInterest = totalInterestAmount.sub(
                repaidInterestAmount
            );
            _nextInstallmentInterest = remainingInterest > interestAmount
                ? interestAmount.sub(repaidExtra)
                : remainingInterest;

            // reset installment interest
            if (
                repaidExtra == 0 &&
                _nextInstallmentAmount > 0 &&
                _nextInstallmentAmount < installmentAmount
            ) {
                _nextInstallmentInterest = 0;
            }
        }

        // calculate the next installment date
        uint256 duration = repaidInstallments.add(1);
        duration = duration > params.duration ? params.duration : duration;

        _nextInstallmentDate = DateTime.addMonths(issuedAt, duration);

        return (
            _nextInstallmentDate,
            _nextInstallmentAmount,
            _nextInstallmentInterest
        );
    }

    function getDetails()
        external
        view
        returns (
            Types.LoanParams memory _params,
            Types.LoanReceipt memory _receipt
        )
    {
        _receipt.totalAmount = totalAmount;
        _receipt.totalInterestAmount = totalInterestAmount;
        _receipt.repaidTotalAmount = repaidTotalAmount;
        _receipt.repaidInterestAmount = repaidInterestAmount;
        _receipt.installmentAmount = installmentAmount;
        _receipt.interestAmount = interestAmount;

        (
            uint256 nextInstallmentDate,
            uint256 nextInstallmentAmount,
            uint256 nextInstallmentInterest
        ) = getNextInstallment();

        _receipt.nextInstallmentDate = nextInstallmentDate;
        _receipt.nextInstallmentAmount = nextInstallmentAmount;
        _receipt.nextInstallmentInterest = nextInstallmentInterest;

        return (params, _receipt);
    }

    function repay(uint256 _amount)
        external
        onlyPond
        returns (uint256 _principal, uint256 _interest)
    {
        require(
            repaidTotalAmount.add(_amount) <= totalAmount,
            "Growr. - Loan cannot be overrepaid"
        );

        (
            ,
            uint256 nextInstallmentAmount,
            uint256 nextInstallmentInterest
        ) = getNextInstallment();

        // repay partial interest first - if amount is less than the interest
        _interest = _amount;

        // repay full interest first - if partial or full installment payment
        if (
            _amount > nextInstallmentInterest &&
            _amount <= nextInstallmentAmount
        ) {
            _interest = nextInstallmentInterest;
        }
        // repay full interest + some interest in advance
        if (_amount > nextInstallmentAmount) {
            // substract nextInstallmentAmount cuz it might be less than full installment amount
            uint256 fullInstallments = _amount.sub(nextInstallmentAmount).div(
                installmentAmount
            );
            uint256 partialInstallment = _amount.sub(nextInstallmentAmount).sub(
                installmentAmount.mul(fullInstallments)
            );

            // calculates how much interest to repay in advance
            _interest = nextInstallmentInterest.add(
                fullInstallments.mul(interestAmount)
            );

            if (partialInstallment > interestAmount) {
                _interest = _interest.add(interestAmount);
            } else {
                _interest = _interest.add(partialInstallment);
            }
        }

        // calculate amount of principal (partial, full or full + partial)
        _principal = _amount.sub(_interest);

        repaidInterestAmount = repaidInterestAmount.add(_interest);
        repaidTotalAmount = repaidTotalAmount.add(_principal).add(_interest);

        return (_principal, _interest);
    }
}
