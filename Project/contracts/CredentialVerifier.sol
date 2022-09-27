//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./lib/TypesLib.sol";
import "./lib/StringUtils.sol";

contract CredentialVerifier {
    using StringUtils for string;

    mapping(string => TypesLib.ProjectCriteria) internal getCriteriaByName;
    TypesLib.ProjectCriteria[] internal criteria;

    constructor(TypesLib.ProjectCriteriaInput memory _inputCriteria) {
        _setCriteria(_inputCriteria);
    }

    function _parseInputCriteria(TypesLib.ProjectCriteriaInput memory _inputCriteria)
        private
    {
        for (uint256 i = 0; i < _inputCriteria.names.length; i++) {
            TypesLib.ProjectCriteria memory _criteria = TypesLib.ProjectCriteria(
                true,
                _inputCriteria.names[i],
                _inputCriteria.types[i],
                _inputCriteria.contents[i],
                _inputCriteria.operators[i]
            );
            criteria.push(_criteria);
            getCriteriaByName[_inputCriteria.names[i]] = _criteria; // TODO:many criterias for one name
        }
    }

    function _verifyCredentials(
        string memory inputName,
        string memory inputValue
    ) private view returns (bool) {
        TypesLib.ProjectCriteria memory _criteria = getCriteriaByName[inputName];

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

    function _setCriteria(TypesLib.ProjectCriteriaInput memory _inputCriteria) internal {
        require(
            _inputCriteria.types.length == _inputCriteria.names.length &&
                _inputCriteria.contents.length == _inputCriteria.names.length &&
                _inputCriteria.operators.length == _inputCriteria.names.length,
            "Growr. - Invalid project criteria"
        );

        _parseInputCriteria(_inputCriteria);
    }

    function verifyCredentials(
        TypesLib.PersonalCredentialsInput memory _credentials
    ) internal view returns (bool) {
        if (_credentials.names.length != _credentials.contents.length) {
            return false;
        }

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

    function getProjectCriteria() external view returns(TypesLib.ProjectCriteria[] memory) {
        return criteria;
    }

    // function getCriteriaNames() public view returns (string[] memory) {
    //     string[] memory names = new string[](criteria.length);

    //     for (uint256 index = 0; index < criteria.length; index++) {
    //         names[index] = criteria[index]._name;
    //     }

    //     return names;
    // }
}
