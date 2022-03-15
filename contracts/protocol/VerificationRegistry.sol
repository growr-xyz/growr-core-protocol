//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationRegistry is Ownable {
    // verifier address => true/false
    mapping(address => Verifier) public getVerifier;
    mapping(address => VerificationRecord) public getVerificationRecord;

    uint256 verifiersCount;

    struct VerificationRecord {
        address _verifier;
        address _object;
        address _subject;
        uint256 _createdAt;
        uint256 _expiryAt;
    }
    struct Verifier {
        address _verifier;
        uint256 _createdAt;
        bool _exists;
    }

    modifier onlyVerifier() {
        require(
            getVerifier[msg.sender]._exists,
            "VerificationRegistry: Caller is not a Verifier"
        );
        _;
    }

    function addVerifier(address _verifier) public onlyOwner {
        getVerifier[_verifier] = Verifier({
            _verifier: _verifier,
            _createdAt: block.timestamp,
            _exists: true
        });
        verifiersCount++;
    }

    function removeVerifier(address _verifier) public onlyOwner {
        delete getVerifier[_verifier];
        verifiersCount--;
    }

    function registerVerification(
        address _object, // the address who own the verification
        address _subject, // the address of the target contract
        uint256 _validity // how long the verification record will last(in seconds)
    ) public onlyVerifier {
        require(
            _object != _subject,
            "VerificationRegistry - Invalid addresses"
        );
        require(_validity > 0, "VerificationRegistry - validity is too low");

        getVerificationRecord[_object] = VerificationRecord({
            _verifier: msg.sender,
            _object: _object,
            _subject: _subject,
            _createdAt: block.timestamp,
            _expiryAt: block.timestamp + _validity
        });
    }

    function revokeVerification(address _object) public onlyVerifier {
        require(
            getVerificationRecord[_object]._verifier == msg.sender,
            "VerificationRegistry - Incorrect verifier"
        );

        delete getVerificationRecord[_object];
    }

    function validateVerification(address _object) public view returns (bool) {
        VerificationRecord memory record = getVerificationRecord[_object];

        // if record exists and its not expired
        if (record._object == _object && block.timestamp <= record._expiryAt) {
            return true;
        }

        return false;
    }
}
