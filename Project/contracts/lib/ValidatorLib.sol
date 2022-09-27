//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library ValidatorLib {
    function requireNonZeroAddress(address _address) internal pure {
        require(_address != address(0), "Growr. - invalid address");
    }

    function requireMultiLoanParams(
        address[] memory _borrowers,
        uint[] memory _amounts,
        bytes[] memory _borrowerSignatures,
        bytes[] memory _verificatorSignatures
    ) internal pure {
        require(_borrowers.length > 0, "Growr. - no borrowers");
        require(_amounts.length > 0, "Growr. - no amounts");
        require(_borrowerSignatures.length > 0, "Growr. - no borrowers signatures");
        require(_verificatorSignatures.length > 0, "Growr. - no verificators signatures");
        require(
            _borrowers.length == _amounts.length &&
            _borrowers.length == _borrowerSignatures.length &&
            _borrowers.length == _verificatorSignatures.length,
            "Growr. - invalid input parameters"
        );
    }

    function requireSingleLoanParams(address _borrower, uint _amount, address _rBorrower) internal pure {
        require(_borrower != address(0), "Growr. - invalid borrower address");
        require(_amount > 0, "Growr. - borrow amount is too low");
        require(_borrower == _rBorrower, "Growr. - borrower signature mismatch");   
    }
}