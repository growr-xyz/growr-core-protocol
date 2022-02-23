//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

import "./Pond.sol";
import "../libraries/types/PondTypes.sol";

contract Pond is Ownable {
    PondTypes.PondParams private params;
    PondTypes.PondCriteria private criteria;

    uint256 public totalDeposited;
    uint256 public totalUtilized;

    constructor(
        PondTypes.PondParams memory _params,
        PondTypes.PondCriteria memory _criteria
    ) {
        params = _params;
        criteria = _criteria;
    }

    function getDetails()
        public
        view
        returns (
            PondTypes.PondParams memory _params,
            PondTypes.PondCriteria memory _criteria,
            uint256 _totalDeposited,
            uint256 _totalUtilized
        )
    {
        return (params, criteria, totalDeposited, totalUtilized);
    }
}
