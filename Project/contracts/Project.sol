// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./lib/TypesLib.sol";
import "./SignatureVerifier.sol";

contract Project is Ownable, SignatureVerifier  {
    
    address public factory;
    bool public active;

    mapping(address => bool) public verificators;
    
    TypesLib.ProjectParams public project;
    TypesLib.ProjectCriteria private criteria;

    modifier onlyFactory() {
        require(msg.sender == factory,
        "Growr. - caller is not the factory");
        _;
    }

    modifier notDeactivated() {
        require(active == true, "Growr. - project is deactivated");
        _;
    }

    constructor(
        TypesLib.ProjectParams memory _project,
        TypesLib.ProjectCriteria memory _criteria
    ) {
        project = _project;
        criteria = _criteria;

        factory = msg.sender;
        active = true;
    }

    function activate() onlyFactory external {
        active = true;
    }

    function deactivate() onlyFactory external {
        active = false;
    }

    function addVerificator(address _verificator) external onlyOwner notDeactivated {
        verificators[_verificator] = true;
    }

    function removeVerificator(address _verificator) external onlyOwner notDeactivated {
        verificators[_verificator] = false;
    }

}
