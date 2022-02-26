//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../libraries/types/Types.sol";
import "../libraries/utils/StringUtils.sol";
import "hardhat/console.sol";

contract CredentialVerifier {
    using StringUtils for string;

    mapping(string => Types.PondCriteria) internal getCriteria;
    Types.PondCriteria[] public criteria;

    constructor(Types.PondCriteriaInput memory _inputCriteria) {
        require(
            _inputCriteria.types.length == _inputCriteria.names.length &&
                _inputCriteria.contents.length == _inputCriteria.names.length &&
                _inputCriteria.operators.length == _inputCriteria.names.length,
            "Growr. - Invalid pond criteria"
        );

        _parseInputCriteria(_inputCriteria);
    }

    function _parseInputCriteria(Types.PondCriteriaInput memory _inputCriteria)
        private
    {
        for (uint256 i = 0; i < _inputCriteria.names.length; i++) {
            Types.PondCriteria memory _criteria = Types.PondCriteria(
                true,
                _inputCriteria.names[i],
                _inputCriteria.types[i],
                _inputCriteria.contents[i],
                _inputCriteria.operators[i]
            );
            criteria.push(_criteria);
            getCriteria[_inputCriteria.names[i]] = _criteria;
        }
    }

    function _verifyCredentials(
        string memory inputName,
        string memory inputValue
    ) private view returns (bool) {
        Types.PondCriteria memory _criteria = getCriteria[inputName];

        if (!_criteria._exists) return false;

        if (_criteria._type.isEqualTo("string"))
            return _criteria._content.isEqualTo(inputValue);

        if (_criteria._type.isEqualTo("uint")) {
            uint256 val = _criteria._content.toUint256();
            uint256 inputVal = inputValue.toUint256();

            if (_criteria._operator.isEqualTo("=")) return val == inputVal;

            if (_criteria._operator.isEqualTo("<")) return val < inputVal;

            if (_criteria._operator.isEqualTo(">")) return val > inputVal;

            if (_criteria._operator.isEqualTo("!=")) return val != inputVal;
        }

        if (_criteria._type.isEqualTo("bool")) {
            bool val = _criteria._content.isEqualTo("true") ? true : false;
            bool inputVal = inputValue.isEqualTo("true") ? true : false;

            return val == inputVal;
        }

        return false;
    }

    function verifyCredentials(
        Types.PersonalCredentialsInput memory _credentials
    ) internal view returns (bool) {
        require(
            _credentials.names.length == _credentials.contents.length,
            "Growr. - Invalid personal credentials"
        );

        bool verified = true;
        for (uint256 i = 0; i < _credentials.names.length; i++) {
            verified = _verifyCredentials(
                _credentials.names[i],
                _credentials.contents[i]
            );

            if (!verified) break;
        }

        return verified;
    }
}
