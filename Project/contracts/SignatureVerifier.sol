// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract SignatureVerifier {

    function recoverSigner(
        bytes32 _hash,
        bytes memory _signature
    ) internal pure returns (address) {
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(_hash);
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function verifySigner(
        address _signer,
        bytes32 _hash,
        bytes memory _signature
    ) public pure returns (bool verified) {
        address recoveredSigner = recoverSigner(_hash, _signature);

        verified = _signer == recoveredSigner; 
    }

    function recoverVerificatorAddress(bytes memory _borrowerSignature, bytes memory _verificatorSignature) external pure returns(address) {
        bytes32 hash = keccak256(abi.encodePacked(_borrowerSignature));

        return recoverSigner(hash, _verificatorSignature);
    }

    function verifyBorrowerSignature(uint _amount, uint _docId, address _borrower, bytes memory _signature) external pure returns(bool) {
        bytes32 hash = keccak256(abi.encodePacked(_amount, _docId));

        return verifySigner(_borrower, hash, _signature);
    }

    function _getEthSignedMessageHash(bytes32 _hash) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
    }

    function _splitSignature(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "invalid signature length");

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
    }
}