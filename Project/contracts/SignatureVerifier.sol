// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

library SignatureVerifier {

    function verifySigner(
        address _signer,
        bytes32 _hash,
        bytes memory _signature
    ) public pure returns (bool verified) {
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(_hash);
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);

        verified = _signer == recoveredSigner; 
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