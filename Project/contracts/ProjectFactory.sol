// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./lib/TypesLib.sol";
import "./Project.sol";


contract ProjectFactory {

    mapping(address => Project[]) public getProjects;
    mapping(Project => uint) public getProjectIndex;

    event ProjectCreated(address indexed projectAddress, string projectId, address projectOwner);
    event ProjectStatusChanged(address indexed projectAddress, bool active);

    function getProjectsLength(address _owner) external view returns (uint numberOfProjects) {
        numberOfProjects = getProjects[_owner].length;
    }

    function createProject(
        TypesLib.ProjectParams memory _params,
        TypesLib.ProjectCriteria memory _criteria
    ) external {
        require(bytes(_params.name).length > 0, "Agrifin - Invalid project name");
        require(
            _criteria.names.length > 0 &&
                _criteria.types.length == _criteria.names.length &&
                _criteria.contents.length == _criteria.names.length &&
                _criteria.operators.length == _criteria.names.length,
            "Agrifin - Invalid project criteria"
        );

        Project project = new Project(_params, _criteria);

        project.transferOwnership(msg.sender);

        getProjects[msg.sender].push(project);
        getProjectIndex[project] = getProjects[msg.sender].length - 1;

        emit ProjectCreated(address(project), _params.id, project.owner());
    }

    function changeProjectStatus(address projectAddress, bool active) external {
        Project project = Project(projectAddress);

        require(project.owner() == msg.sender, "Agrifin - Caller is not the owner");

        if (active) {
            project.activate();
        } else {
            project.deactivate();
        }

        emit ProjectStatusChanged(projectAddress, active);
    }
}
