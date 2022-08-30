//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
// pragma abicoder v2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Pond.sol";

import "../libraries/types/Types.sol";

contract PondFactory {
    address public immutable verificationRegistry;
    address public immutable WRBTC;

    // user => pond => id
    mapping(address => mapping(address => uint)) public getUserPondId;
    // stores created Ponds by user
    mapping(address => Pond[]) public getUserPond;
    // pond => id
    mapping(address => uint) public getPondId;
    // stores all ponds
    Pond[] public getPond;

    event PondCreated(address addr, address owner, uint256 timestamp);

    constructor(address _verificationRegistry, address _wrbtc) {
        verificationRegistry = _verificationRegistry;
        WRBTC = _wrbtc;
    }

    function getAllPondsLength() external view returns (uint256) {
        return getPond.length;
    }

    function getUserPondsLength(address user) external view returns (uint256) {
        return getUserPond[user].length;
    }

    // dev TODO: remove me
    function getUserPonds(address user) external view returns (Pond[] memory) {
        return getUserPond[user];
    }

    function getAllPonds() external view returns (Pond[] memory) {
        return getPond;
    }

    // /dev

    function createPond(
        Types.PondParams memory _params,
        Types.PondCriteriaInput memory _criteria
    ) external {
        require(bytes(_params.name).length > 0, "Growr. - Invalid pond name");
        require(
            _params.cashBackRate < _params.annualInterestRate,
            "Growr. - Cashback rate should be less than annual interest rate"
        );
        require(
            _params.minLoanAmount < _params.maxLoanAmount,
            "Growr. - minLoanAmount should be less than maxLoanAmount"
        );
        require(
            _params.minLoanDuration < _params.maxLoanDuration,
            "Growr. - minLoanDuration should be less than maxLoanDuration"
        );
        require(
            _criteria.names.length > 0 &&
                _criteria.types.length == _criteria.names.length &&
                _criteria.contents.length == _criteria.names.length &&
                _criteria.operators.length == _criteria.names.length,
            "Growr. - Invalid pond criteria"
        );

        Pond pond = new Pond(verificationRegistry, WRBTC, _params, _criteria);

        address pondAddress = address(pond);

        getPond.push(pond);
        getPondId[pondAddress] = getPond.length - 1;
        getUserPond[msg.sender].push(pond);
        getUserPondId[msg.sender][pondAddress] =
            getUserPond[msg.sender].length -
            1;

        pond.transferOwnership(msg.sender);

        emit PondCreated(pondAddress, msg.sender, block.timestamp);
    }

    function destroyPond(address pondAddress) external {
        uint userPondId = getUserPondId[msg.sender][pondAddress];
        uint pondId = getPondId[pondAddress];

        Pond pond = getPond[pondId];
        Pond userPond = getUserPond[msg.sender][userPondId];

        require(address(pond) == pondAddress, "Growr. - Pond does not exists");
        require(
            address(userPond) == pondAddress,
            "Growr. - Pond does not exists"
        );

        pond.destroy();

        delete getPond[pondId];
        delete getPondId[pondAddress];
        delete getUserPond[msg.sender][userPondId];
        delete getUserPondId[msg.sender][pondAddress];
    }
}
