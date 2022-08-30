//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IVerificationRegistry {
    function validateVerification(address _subject, address _object)
        external
        view
        returns (bool);
}
