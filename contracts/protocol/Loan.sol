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

    uint256 public totalInterest; // total interest amount to be paid for the whole period
    uint256 public totalAmount; // total amount + interest to be paid
    uint256 public installmentInterest; // monthly interest amount
    uint256 public installmentAmount; // principal + interest to be paid every month
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

        totalInterest = _amount
            .mul(_annualInterestRate)
            .mul(100)
            .mul(_duration)
            .div(10000)
            .div(12);
        totalAmount = _amount.add(totalInterest);

        installmentAmount = totalAmount.div(_duration);
        installmentInterest = totalInterest.div(_duration);

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

    // TODO: refactor
    function getNextInstallment()
        internal
        view
        returns (Types.NextInstallment memory _nextInstallment)
    {
        uint256 elapsedDuration = getElapsedDuration();

        _nextInstallment.total = installmentAmount;
        _nextInstallment.interest = installmentInterest;
        // uint256 elapsedDuration = getElapsedDuration();
        uint256 repaidInstallments = elapsedDuration;
        // calculates the minimum amount + interest that needs to be paid so far
        uint256 expectedAmount = installmentAmount.mul(elapsedDuration);
        uint256 expectedInterest = installmentInterest.mul(elapsedDuration);

        // if the loan is overdue, add the missing amount to next installment
        if (expectedAmount > repaidTotalAmount) {
            _nextInstallment.total = expectedAmount.sub(repaidTotalAmount);
        }
        // if the loan is prematured, substract the extra amount from next installment amount
        if (repaidTotalAmount > expectedAmount) {
            repaidInstallments = repaidTotalAmount.div(installmentAmount);
            uint256 repaidExtra = repaidTotalAmount.sub(
                installmentAmount.mul(repaidInstallments)
            );
            uint256 remainingAmount = totalAmount.sub(repaidTotalAmount);

            _nextInstallment.total = remainingAmount > installmentAmount
                ? installmentAmount.sub(repaidExtra)
                : remainingAmount;
        }

        // if the loan is overdue, add the missing interest to next installment
        if (expectedInterest > repaidInterestAmount) {
            _nextInstallment.interest = expectedInterest.sub(
                repaidInterestAmount
            );
        }
        // if the loan is prematured, substract the extra interest from next installment
        if (repaidInterestAmount > expectedInterest) {
            uint256 repaidExtra = repaidInterestAmount.sub(
                installmentInterest.mul(
                    repaidInterestAmount.div(installmentInterest)
                )
            );

            uint256 remainingInterest = totalInterest.sub(repaidInterestAmount);
            _nextInstallment.interest = remainingInterest > installmentInterest
                ? installmentInterest.sub(repaidExtra)
                : remainingInterest;

            // set next interest to 0
            // if the interest is fully repaid for the current installment
            // and the principal is still partially repaid
            if (
                repaidExtra == 0 &&
                _nextInstallment.total > 0 &&
                _nextInstallment.total < installmentAmount
            ) {
                _nextInstallment.interest = 0;
            }
        }

        // calculate the next installment date
        uint256 duration = repaidInstallments.add(1);
        duration = duration > params.duration ? params.duration : duration;

        _nextInstallment.timestamp = DateTime.addMonths(issuedAt, duration);
        _nextInstallment.principal = _nextInstallment.total.sub(
            _nextInstallment.interest
        );
        return _nextInstallment;
    }

    function getDetails()
        external
        view
        returns (
            Types.LoanParams memory _params,
            Types.LoanReceipt memory _receipt
        )
    {
        return (
            params,
            Types.LoanReceipt({
                totalAmount: totalAmount,
                totalInterest: totalInterest,
                repaidTotalAmount: repaidTotalAmount,
                repaidInterestAmount: repaidInterestAmount,
                installmentAmount: installmentAmount,
                installmentInterest: installmentInterest,
                nextInstallment: getNextInstallment()
            })
        );
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

        Types.NextInstallment memory nextInstallment = getNextInstallment();

        // repay partial interest first - if amount is less than the interest
        _interest = _amount;

        // repay full interest first - if partial or full installment payment
        if (
            _amount > nextInstallment.interest &&
            _amount <= nextInstallment.total
        ) {
            _interest = nextInstallment.interest;
        }
        // repay full interest + some interest in advance
        if (_amount > nextInstallment.total) {
            // substract nextInstallment.total cuz it might be less than full installment amount
            uint256 fullInstallments = _amount.sub(nextInstallment.total).div(
                installmentAmount
            );
            uint256 partialInstallment = _amount.sub(nextInstallment.total).sub(
                installmentAmount.mul(fullInstallments)
            );

            // calculates how much interest to repay in advance
            _interest = nextInstallment.interest.add(
                fullInstallments.mul(installmentInterest)
            );

            if (partialInstallment > installmentInterest) {
                _interest = _interest.add(installmentInterest);
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
