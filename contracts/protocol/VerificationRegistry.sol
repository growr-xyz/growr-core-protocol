//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../libraries/types/Types.sol";
import "../interfaces/IVerificationRegistry.sol";

contract VerificationRegistry is Ownable, IVerificationRegistry {
    // verifier address => true/false
    mapping(address => Types.Verifier) public getVerifier;
    //TODO: userAddress -> pondAddress -> record with timestamp
    mapping(address => Types.VerificationRecord) public getVerificationRecord;

    uint256 public getVerifiersCount;

    modifier onlyVerifier() {
        require(
            getVerifier[msg.sender]._exists,
            "VerificationRegistry: Caller is not a Verifier"
        );
        _;
    }

    function addVerifier(address _verifier) public onlyOwner {
        getVerifier[_verifier] = Types.Verifier({
            _verifier: _verifier,
            _createdAt: block.timestamp,
            _exists: true
        });
        getVerifiersCount++;
    }

    function removeVerifier(address _verifier) public onlyOwner {
        delete getVerifier[_verifier];
        getVerifiersCount--;
    }

    function registerVerification(
        address _subject, // the address who own the verification
        address _object, // the address of the target contract        
        uint256 _validity // how long the verification record will last(in seconds)
    ) public onlyVerifier {
        require(
            _object != _subject,
            "VerificationRegistry - Invalid addresses"
        );
        require(_validity > 0, "VerificationRegistry - validity is too low");

        getVerificationRecord[_subject] = Types.VerificationRecord({
            _verifier: msg.sender,
            _object: _object,
            _subject: _subject,
            _createdAt: block.timestamp,
            _expiryAt: block.timestamp + _validity
        });
    }

    function revokeVerification(address _subject) public onlyVerifier {
        require(
            getVerificationRecord[_subject]._verifier == msg.sender,
            "VerificationRegistry - Incorrect verifier"
        );

        delete getVerificationRecord[_subject];
    }

    function validateVerification(address _subject, address _object)
        public
        view
        override
        returns (bool)
    {
        Types.VerificationRecord memory record = getVerificationRecord[_subject];

        // if record exists and its not expired
        if (
            record._object == _object &&
            record._subject == _subject &&
            block.timestamp <= record._expiryAt
        ) {
            return true;
        }

        return false;
    }
}
