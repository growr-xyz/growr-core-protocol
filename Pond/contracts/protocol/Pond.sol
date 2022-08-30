//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

import "./Pond.sol";
import "./Loan.sol";
import "./CredentialVerifier.sol";
import "../libraries/types/Types.sol";
import "../interfaces/IVerificationRegistry.sol";

import "../interfaces/IWRBTC.sol";

contract Pond is Ownable, CredentialVerifier {
    using SafeMath for uint256;

    Types.PondParams private params;

    address public immutable WRBTC;
    address public immutable verificationRegistry;
    address public immutable factory;

    mapping(address => uint256) public getLenderBalance;
    mapping(address => Loan) public getLoan;

    uint256 public totalDeposited;
    uint256 public totalUtilized;
    uint256 public totalInterest;

    bool public active;

    event RepayLoan(
        address indexed addr,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyFactory() {
        require(msg.sender == factory, "Growr. - Access denied");
        _;
    }

    modifier notClosed() {
        require(active, "Growr. - Pond is not active anymore");
        _;
    }

    modifier wrbtcPond() {
        require(
            address(params.token) == WRBTC,
            "Growr. - RBTC not supported by this Pond"
        );
        _;
    }

    constructor(
        address _verificationRegistry,
        address _wrbtc,
        Types.PondParams memory _params,
        Types.PondCriteriaInput memory _criteria
    ) CredentialVerifier(_criteria) {
        active = true;
        params = _params;

        factory = msg.sender;
        verificationRegistry = _verificationRegistry;
        WRBTC = _wrbtc;
    }

    // receives unwrapped rbtc
    receive() external payable {}

    function _deposit(uint256 _amount) private {
        require(_amount > 0, "Growr. - Deposit amount must be more than 0");

        totalDeposited = totalDeposited.add(_amount);
        getLenderBalance[msg.sender] = getLenderBalance[msg.sender].add(
            _amount
        );
    }

    function _withdraw(uint256 _amount) private {
        require(_amount > 0, "Growr. - Withdraw amount must be more than 0");

        uint256 lenderBalance = getLenderBalance[msg.sender];
        uint256 availableAmount = getAvailableBalance();

        require(
            lenderBalance > 0 && lenderBalance >= _amount,
            "Growr. - Withdrawal amount exceeds your balance"
        );
        require(
            availableAmount >= _amount,
            "Growr. - Withdrawal amount exceeds available balance"
        );

        // reduce lender's balance and total amount of deposited funds
        getLenderBalance[msg.sender] = lenderBalance.sub(_amount);
        totalDeposited = totalDeposited.sub(_amount);
    }

    /**
        returns available balance that can be borrowed
     */
    function getAvailableBalance() public view returns (uint256) {
        return params.token.balanceOf(address(this)).sub(totalInterest);
    }

    function getDetails()
        public
        view
        returns (
            Types.PondParams memory _params,
            Types.PondCriteria[] memory _criteria,
            uint256 _totalDeposited,
            uint256 _totalUtilized,
            uint256 _totalInterest,
            bool _active
        )
    {
        return (params, criteria, totalDeposited, totalUtilized, totalInterest, active);
    }

    /**
        Checks if the user is eligible for borrowing a loan.
        If some of the input params are not in the pond capabilities,
        it returns the most suitable loan the user can borrow at that time
     */
    function getLoanOffer(
        uint256 _amount,
        uint256 _duration,
        Types.PersonalCredentialsInput memory _credentials
    ) external view returns (Types.LoanOffer memory _loan) {
        uint256 amount = _amount;
        uint256 duration = _duration;

        // get most suitable loan amount
        if (amount < params.minLoanAmount) amount = params.minLoanAmount;
        else if (amount > params.maxLoanAmount) amount = params.maxLoanAmount;

        // get most suitable loan duration
        if (duration < params.minLoanDuration)
            duration = params.minLoanDuration;
        else if (duration > params.maxLoanDuration)
            duration = params.maxLoanDuration;

        bool eligible = false;
        // check credentials only if the pond is still active
        if (active) {
            eligible = verifyCredentials(_credentials);
        }

        // check available balance
        uint256 balance = getAvailableBalance();
        if (balance <= 0) eligible = false;
        if (amount > balance) amount = balance;

        _loan = Types.LoanOffer(
            false,
            amount,
            duration,
            params.annualInterestRate,
            params.disbursmentFee,
            params.cashBackRate,
            0,
            0,
            0
        );

        if (eligible) {
            _loan.approved = true;
            _loan.totalInterest = amount
                .mul(params.annualInterestRate)
                .mul(duration)
                .div(100)
                .div(12);
            _loan.totalAmount = amount.add(_loan.totalInterest);
            _loan.installmentAmount = _loan.totalAmount.div(duration);
        }

        return _loan;
    }

    function borrow(uint256 _amount, uint256 _duration) public notClosed {
        require(
            _amount >= params.minLoanAmount,
            "Growr.- Amount is less than min loan amount"
        );
        require(
            _amount <= params.maxLoanAmount,
            "Growr. - Amount exceeds max loan amount"
        );
        require(
            _amount <= getAvailableBalance(),
            "Growr. - Not enough funds to borrow"
        );
        require(
            _duration >= params.minLoanDuration,
            "Growr. - Duration is less than min loan duration"
        );
        require(
            _duration <= params.maxLoanDuration,
            "Growr. - Duration exceeds max loan duration"
        );

        bool eligible = IVerificationRegistry(verificationRegistry)
            .validateVerification(msg.sender, address(this));

        require(eligible, "Growr. - Eligibility verificaiton failed");

        totalUtilized = totalUtilized.add(_amount);

        getLoan[msg.sender] = new Loan(
            params.token,
            _amount,
            _duration,
            params.annualInterestRate,
            params.disbursmentFee,
            params.cashBackRate
        );

        params.token.transfer(msg.sender, _amount);
    }

    function repay(uint256 _amount, address _loan) external {
        require(_amount > 0, "Growr. - Repay amount must be more than 0");

        Loan loan = getLoan[msg.sender];

        require(address(loan) == _loan, "Growr. - Loan does not exists");

        (uint256 principal, uint256 interest) = loan.repay(_amount);

        totalUtilized = totalUtilized.sub(principal);
        totalInterest = totalInterest.add(interest);

        params.token.transferFrom(msg.sender, address(this), _amount);

        emit RepayLoan(address(loan), msg.sender, _amount, block.timestamp);
    }

    /**
        Deposit RBTC only if the current Pond supports it
        Wrap the native RBTC into WRBTC
     */
    function depositRBTC(uint256 _amount) external payable wrbtcPond notClosed {
        require(
            _amount <= msg.value,
            "Growr. - Deposit amount exceeds the sending amount"
        );

        _deposit(_amount);

        IWRBTC(WRBTC).deposit{value: _amount}();
    }

    /**
        Deposit every ERC20 token supported by the current Pond
     */
    function deposit(uint256 _amount) external notClosed {
        _deposit(_amount);

        params.token.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawRBTC(uint256 _amount) external wrbtcPond {
        _withdraw(_amount);

        IWRBTC(WRBTC).withdraw(_amount);
        payable(msg.sender).transfer(_amount);
    }

    function withdraw(uint256 _amount) external {
        _withdraw(_amount);

        // TODO: withdraw interest
        // totalInterest = ??

        params.token.transfer(msg.sender, _amount);
    }

    function deactivate() public onlyOwner notClosed {
        active = false;
    }

    function activate() public onlyOwner notClosed {
        active = true;
    }

    function destroy() public onlyFactory {
        require(tx.origin == owner(), "Growr. - Access denied");
        require(
            totalDeposited == 0,
            "Growr. - Pond cannot be destroyed due to active deposits"
        );
        require(
            totalUtilized == 0,
            "Growr. - Pond cannot be destroyed due to active loans"
        );

        // TODO: check for interest
        // totalInterest = ??

        selfdestruct(payable(address(owner())));
    }
}
