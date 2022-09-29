// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

library TypesLib {

    struct ProjectParams {
        string id;
        string name;
        uint startDate;
        uint endDate;
        uint amount;
        uint interestRate;
        uint cashbackRate;
        uint gracePeriod;
    }

     struct ProjectCriteria {
        bool _exists;
        string _name;
        string _type;
        string _content;
        string _operator;
    }

    struct ProjectCriteriaInput {
        string[] names;
        string[] types;
        string[] contents;
        string[] operators;
    }
    
    struct PersonalCredentialsInput {
        string[] names;
        string[] contents;
    }

    struct Loan {
        address borrower;
        uint amount;
        uint loanId;
        uint docId;
        uint createdAt;
        LoanStatus status;
    }

    struct Verificator {
        bool hasCredentialAccess;
        bool hasPaymentAccess;
    }
    enum LoanStatus {
        CREATED,
        DISBURSED,
        CANCELED,
        REPAYED
    }

    enum VerificatorType {
        CREDENTIAL,
        PAYMENT
    }
}
