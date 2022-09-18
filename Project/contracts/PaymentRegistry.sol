// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentRegistry {

    address public factory;

    // project address => user => role
    mapping(address => mapping(address => Role)) public getRole;
    // project address => document ID => record
    mapping(address => mapping(uint => Record)) public getRecord;
    // document ID => project
    mapping(uint => address) public getProjectByDocumentId;

    struct Role {
        bool isOwner;
        bool isAdmin;
    }

    struct Record {
        uint documentId;
        uint amount;
        bool exists;
        RecordType recordType;
        RecordStatus recordStatus;
    }

    enum RecordType { DISBURSE, CANCEL }
    enum RecordStatus { CONFIRMED, CANCELED, CREATED }

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
    event RecordCreated(address indexed projectAddress, uint indexed documentId, Record record);

    constructor() {
        factory = msg.sender;
    }

    function requireOnlyAdmin(address _project) internal onlyAdmin(_project) {}
    function requireDocumentToExists(bool _exists, address _project, uint _documentId) internal view {
        string memory errorMessage = _exists ? "Growr. - record does not exists" : "Growr. - record already exists";

    	require(getRecord[_project][_documentId].exists == _exists, errorMessage);
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

    function createRecord(address _project, uint _documentId, uint _amount, RecordType _type) external onlyAdmin(_project) {
        require(_project != address(0), "Growr. - project is zero address");
        require(_amount > 0, "Growr. - amount is too low");

        requireDocumentToExists(false, _project, _documentId);

        Record memory _record = getRecord[_project][_documentId];

        _record = Record(_documentId, _amount, true, _type, RecordStatus.CREATED);

        getRecord[_project][_documentId] = _record;
        getProjectByDocumentId[_documentId] = _project;

        emit RecordCreated(_project, _documentId, _record);
    }

    function confirmRecord(uint _documentId) external {
        address _project = getProjectByDocumentId[_documentId];

        requireOnlyAdmin(_project);
        requireDocumentToExists(true, _project, _documentId);

        Record storage _record = getRecord[_project][_documentId];

        _record.recordStatus = RecordStatus.CONFIRMED;
    }
}