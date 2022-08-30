// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./lib/TypesLib.sol";

contract Project is Ownable {
    
    address public factory;
    bool public active;
    
    TypesLib.ProjectParams public project;
    TypesLib.ProjectCriteria private criteria;

    modifier onlyFactory() {
        require(msg.sender == factory, "Agrifin - caller is not the factory");
        _;
    }

    constructor(
        TypesLib.ProjectParams memory _project,
        TypesLib.ProjectCriteria memory _criteria
    ) {
        project = _project;
        criteria = _criteria;

        factory = msg.sender;
    }

    function activate() onlyFactory external {
        active = true;
    }

    function deactivate() onlyFactory external {
        active = false;
    }
}
