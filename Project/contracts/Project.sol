// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./lib/TypesLib.sol";
import "./lib/ValidatorLib.sol";
import "./SignatureVerifier.sol";
import "./CredentialVerifier.sol";

import "hardhat/console.sol";

contract Project is Ownable, SignatureVerifier, CredentialVerifier  {
    
    address public factory;
    bool public active;

    // verificator address => Verificator
    mapping(address => TypesLib.Verificator) public verificators;
    
    TypesLib.Loan[] public getLoanById;
    // borrower => loan ids
    mapping(address => uint[]) public getLoanIdsByBorrower;
    // docId => loan ids
    mapping(uint => uint[]) public getLoanIdsByDocId;
    // docId => status
    mapping(uint => TypesLib.LoanStatus) public getLoansStatusByDocId;
    // docId => transaction id
    mapping(uint => string) public getTxIdByDocId;


    TypesLib.ProjectParams public project;

    modifier onlyFactory() {
        require(msg.sender == factory,
        "Growr. - caller is not the factory");
        _;
    }

    modifier onlyCredentialVerificator(address _verificator) {
        _verificator = _verificator == address(0) ? msg.sender : _verificator;

        require(verificators[_verificator].hasCredentialAccess == true,
        "Growr. - credential verificator is not whitelisted");
        _;
    }

    modifier onlyPaymentVerificator() {
        require(verificators[msg.sender].hasPaymentAccess == true,
        "Growr. - payment verificator is not whitelisted");
        _;
    }

    modifier onlyLoansWithStatus(uint _docId, TypesLib.LoanStatus _status) {
         require(getLoansStatusByDocId[_docId] == _status, "Growr. - loans are in progress");
         _;
    }

    modifier notDeactivated() {
        require(active == true, "Growr. - project is deactivated");
        _;
    }

    event LoanCreated(uint indexed loanId, address indexed borrower, uint indexed docId, TypesLib.Loan loan);
    event LoanStatusChanged(uint indexed loanId, address indexed verificator, uint indexed docId, TypesLib.LoanStatus status);

    constructor(
        TypesLib.ProjectParams memory _project,
        TypesLib.ProjectCriteriaInput memory _criteria
    ) CredentialVerifier(_criteria) {
        project = _project;

        factory = msg.sender;
        active = true;
    }

    function changeLoanStatus(uint _docId, TypesLib.LoanStatus _status) private {
        uint[] memory loanIds = getLoanIdsByDocId[_docId];

        require(loanIds.length > 0, "Growr. - no loans found");

        getLoansStatusByDocId[_docId] = _status;

        for (uint i = 0; i < loanIds.length; i++) {
            uint loanId = loanIds[i];
            TypesLib.Loan storage loan = getLoanById[loanId];

            loan.status = _status;

            emit LoanStatusChanged(loanId, msg.sender, _docId, _status);
           
        }
    }

    function activate() onlyFactory external {
        active = true;
    }

    function deactivate() onlyFactory external {
        active = false;
    }

    function addVerificator(address _verificator, TypesLib.VerificatorType _type) external onlyOwner notDeactivated {
        ValidatorLib.requireNonZeroAddress(_verificator);
        
        if (_type == TypesLib.VerificatorType.CREDENTIAL) {
            verificators[_verificator].hasCredentialAccess = true;
        }
        if (_type == TypesLib.VerificatorType.PAYMENT) {
            verificators[_verificator].hasPaymentAccess = true;
        }
        
    }

    function removeVerificator(address _verificator, TypesLib.VerificatorType _type) external onlyOwner notDeactivated {
        ValidatorLib.requireNonZeroAddress(_verificator);
        
        if (_type == TypesLib.VerificatorType.CREDENTIAL) {
            verificators[_verificator].hasCredentialAccess = false;
        }
        if (_type == TypesLib.VerificatorType.PAYMENT) {
            verificators[_verificator].hasPaymentAccess = false;
        }
        
    }

    function getBorrowerLoansCount(address _borrower) external view returns(uint) {
        return getLoanIdsByBorrower[_borrower].length;
    }

    function getLoansByBorrower(address _borrower) external view returns(TypesLib.Loan[] memory _loans) {
        ValidatorLib.requireNonZeroAddress(_borrower);

        uint[] memory loanIds = getLoanIdsByBorrower[_borrower];

        _loans = new TypesLib.Loan[](loanIds.length);

        for (uint i = 0; i < loanIds.length; i++) {
            _loans[i] = getLoanById[loanIds[i]];
        }
    }

    function getLoansByDocument(uint _docId) external view returns(TypesLib.Loan[] memory _loans) {
        uint[] memory loanIds = getLoanIdsByDocId[_docId];

        _loans = new TypesLib.Loan[](loanIds.length);

        for (uint i = 0; i < loanIds.length; i++) {
            _loans[i] = getLoanById[loanIds[i]];
        }
    }

    function getLoansByStatus(TypesLib.LoanStatus _status) external view  returns(TypesLib.Loan[] memory _loans) {
        uint loanIds = 0;
        for (uint loanId = 0; loanId < getLoanById.length; loanId++) {
            TypesLib.Loan memory loan = getLoanById[loanId];
            if (loan.status != _status) continue;

            loanIds++;
        }

        _loans = new TypesLib.Loan[](loanIds);

        for (uint id = 0; id < loanIds; id++) {
            _loans[id] = getLoanById[id];
        }
    }

    /**
     * creates a signle loan
     */
    function createSingleLoan(
        address _borrower,
        uint _amount,
        bytes memory _borrowerSignature,
        bytes memory _verificatorSignature,
        uint _docId
    ) private onlyCredentialVerificator(this.recoverVerificatorAddress(_borrower, _amount, _docId, _verificatorSignature)) {
        ValidatorLib.requireSingleLoanParams(
            _borrower,
            _amount,
            this.recoverBorrowerAddress(_borrowerSignature, _verificatorSignature)
        );

        uint loanId = getLoanById.length;
        TypesLib.Loan memory loan = TypesLib.Loan({
            borrower: _borrower,
            amount: _amount,
            loanId: loanId,
            docId: _docId,
            createdAt: block.timestamp,
            status: TypesLib.LoanStatus.CREATED
        });

        getLoanById.push(loan);
        getLoanIdsByBorrower[_borrower].push(loanId);
        getLoanIdsByDocId[_docId].push(loanId);

        emit LoanCreated(loanId, _borrower, _docId, loan);
    }

    /**
     * creates multiple loans in a signle transaction
     */
    function createLoans(
        address[] memory _borrowers,
        uint[] memory _amounts,
        bytes[] memory _borrowerSignatures,
        bytes[] memory _verificatorSignatures,
        uint _docId
    ) external notDeactivated onlyLoansWithStatus(_docId, TypesLib.LoanStatus.CREATED) {
        ValidatorLib.requireMultiLoanParams(_borrowers, _amounts, _borrowerSignatures, _verificatorSignatures);

        for (uint i = 0; i < _borrowers.length; i++) {
            createSingleLoan(
                _borrowers[i],
                _amounts[i],
                _borrowerSignatures[i],
                _verificatorSignatures[i],
                _docId
            );
        }
    }

    /**
     * cancel all loans for the given document Id. Should cancel loans with status CREATED only
     */
    function cancelLoans(uint _docId) external onlyPaymentVerificator onlyLoansWithStatus(_docId, TypesLib.LoanStatus.CREATED) {
        changeLoanStatus(_docId, TypesLib.LoanStatus.CANCELED);
    }

    /**
     * disburse all loans for the given document Id. Should disburse loans with status CREATED only
     */
    function disburseLoans(uint _docId, string memory _txId) external onlyPaymentVerificator onlyLoansWithStatus(_docId, TypesLib.LoanStatus.CREATED)  {
        getTxIdByDocId[_docId] = _txId;

        changeLoanStatus(_docId, TypesLib.LoanStatus.DISBURSED);
    }
}
