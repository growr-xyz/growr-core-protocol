//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Pond.sol";

import "../libraries/types/PondTypes.sol";

contract PondFactory {
    // stores created Ponds by user
    mapping(address => Pond[]) public getPonds;

    event PondCreated(address addr, address owner, uint256 timestamp);

    constructor() {}

    function createPond(
        PondTypes.Params memory _params,
        PondTypes.Criteria memory _criteria
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
                _criteria.operations.length == _criteria.names.length,
            "Growr. - Invalid pond criteria"
        );

        Pond pond = new Pond(_params, _criteria);

        getPonds[msg.sender].push(pond);

        pond.transferOwnership(msg.sender);

        emit PondCreated(address(pond), msg.sender, block.timestamp);
    }

    function getUserPonds(address user) external view returns (Pond[] memory) {
        return getPonds[user];
    }
}
