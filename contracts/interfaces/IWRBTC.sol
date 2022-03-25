//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IWRBTC {
    function deposit() external payable;

    function withdraw(uint256 wad) external;
}
