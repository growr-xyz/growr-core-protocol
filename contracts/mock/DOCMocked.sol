//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DOCMocked is ERC20 {
    constructor() ERC20("DOC Token", "DOC") {}

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
