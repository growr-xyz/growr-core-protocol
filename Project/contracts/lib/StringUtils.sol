//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library StringUtils {
    /**
        The _start basically points to the byte index in bytes array where the integer value starts.
        The first 32 (or 0x20 in hex) bytes contain the length of the bytes array and then
        starts the integer value which is stored in the next 32 bytes. 
        The _start value is zero because second set of 32 bytes contain the integer value you need. 
        You can essentially convert this function to this.
    */
    function toUint256(string memory _string)
        internal
        pure
        returns (uint256 value)
    {
        bytes memory _bytes = bytes(_string);
        assembly {
            value := mload(add(_bytes, 0x20))
        }
    }

    function isEqualTo(string memory _string, string memory _compareTo)
        internal
        pure
        returns (bool)
    {
        return keccak256(bytes(_string)) == keccak256(bytes(_compareTo));
    }
}
