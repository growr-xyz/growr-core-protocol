// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentRegistry {

    address public factory;

    // project address => user => role
    mapping(address => mapping(address => Role)) public getRole;

    struct Role {
        bool isOwner;
        bool isAdmin;
    }

    modifier onlyAdmin(address _project) {
        require(getRole[_project][msg.sender].isAdmin == true, "Growr. - access denied");
        _;
    }

    modifier onlyOwner(address _project) {
        require(getRole[_project][msg.sender].isOwner == true, "Growr. - access denied");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Growr. - access denied");
        _;
    }

    event RoleUpdated(address indexed projectAddress, address indexed user, Role updatedRole);

    constructor() {
        factory = msg.sender;
    }

    function addOwner(address _project, address _user) public onlyFactory {
        Role memory updatedRole = Role({
            isOwner: true,
            isAdmin: true
        });
        getRole[_project][_user] = updatedRole;

        emit RoleUpdated(_project, _user, updatedRole);
    }

    function updateAdmin(address _project, address _user, bool _isAdmin) public onlyOwner(_project) {
        Role memory updatedRole = getRole[_project][_user];

        updatedRole.isAdmin = _isAdmin;

        getRole[_project][_user] = updatedRole;
        
        emit RoleUpdated(_project, _user, updatedRole);
    }
}