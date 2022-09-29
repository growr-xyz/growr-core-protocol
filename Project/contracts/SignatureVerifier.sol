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

    function recoverVerificatorAddress(address _borrower, uint _amount, uint _docId, bytes memory _signature) external pure returns(address) {
        bytes32 hash = keccak256(abi.encodePacked(_borrower, _amount, _docId));

        return recoverSigner(hash, _signature);
    }

    function recoverBorrowerAddress(bytes memory _borrowerSignature, bytes memory _verificatorSignature) external pure returns(address) {
        bytes32 hash = keccak256(abi.encodePacked(_verificatorSignature));

        return recoverSigner(hash, _borrowerSignature);
    }

    function verifyBorrowerSignature(address _borrower, bytes memory _borrowerSignature, bytes memory _verificatorSignature) external pure returns(bool) {
        bytes32 hash = keccak256(abi.encodePacked(_verificatorSignature));

        return verifySigner(_borrower, hash, _borrowerSignature);
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