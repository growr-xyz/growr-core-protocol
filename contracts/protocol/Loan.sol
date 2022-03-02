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

    uint256 public interestAmount;
    uint256 public totalAmount;
    uint256 public installmentAmount;
    uint256 public repaidTotalAmount;
    uint256 public repaidInterestAmount;
    uint256 public issuedAt;

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

        interestAmount = _amount
            .mul(_annualInterestRate)
            .mul(100)
            .mul(_duration)
            .div(10000)
            .div(12);
        totalAmount = _amount.add(interestAmount);
        installmentAmount = totalAmount.div(_duration);

        params = Types.LoanParams({
            token: _token,
            amount: _amount,
            duration: _duration,
            annualInterestRate: _annualInterestRate,
            disbursmentFee: _disbursmentFee,
            cashBackRate: _cashBackRate
        });
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
        _receipt.interestAmount = interestAmount;
        _receipt.repaidTotalAmount = repaidTotalAmount;
        _receipt.repaidInterestAmount = repaidInterestAmount;
        _receipt.installmentAmount = installmentAmount;
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

        _receipt.nextInstallmentDate = DateTime.addMonths(
            issuedAt,
            elapsedDuration.add(1)
        );

        _receipt.nextInstallmentAmount = _receipt.installmentAmount;
        uint256 expectedAmount = _receipt.installmentAmount.mul(
            elapsedDuration
        );

        // calculates next installment amount
        if (_receipt.repaidTotalAmount >= expectedAmount) {
            uint256 extra = _receipt.repaidTotalAmount.sub(expectedAmount);

            _receipt.nextInstallmentAmount = extra > _receipt.installmentAmount
                ? 0
                : _receipt.nextInstallmentAmount.sub(extra);
        } else {
            _receipt.nextInstallmentAmount = expectedAmount.sub(
                _receipt.repaidTotalAmount
            );
        }

        return (params, _receipt);
    }

    function repay(uint256 _amount) external onlyPond {
        // uint256 amount = _principal.add(_interest);

        require(
            _amount >= installmentAmount,
            "Growr. - Amount is less than installment amount"
        );

        repaidTotalAmount = repaidTotalAmount.add(_amount);
    }
}
