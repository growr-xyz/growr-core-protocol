//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IVerificationRegistry {
    function validateVerification(address _object, address _subject)
        external
        view
        returns (bool);
}
