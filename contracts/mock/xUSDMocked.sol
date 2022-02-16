//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract xUSDMocked is ERC20 {
    constructor() ERC20("xUSD Token", "xUSD") {}

    function mint(uint amount) public {
        _mint(msg.sender, amount);
    }
}