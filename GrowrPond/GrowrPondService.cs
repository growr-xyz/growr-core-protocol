using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Numerics;
using Nethereum.Hex.HexTypes;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Web3;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Contracts.CQS;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.Contracts;
using System.Threading;
using GrowrCoreProtocol.Contracts.GrowrPond.ContractDefinition;

namespace GrowrCoreProtocol.Contracts.GrowrPond
{
    public partial class GrowrPondService
    {
        public static Task<TransactionReceipt> DeployContractAndWaitForReceiptAsync(Nethereum.Web3.Web3 web3, GrowrPondDeployment growrPondDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            return web3.Eth.GetContractDeploymentHandler<GrowrPondDeployment>().SendRequestAndWaitForReceiptAsync(growrPondDeployment, cancellationTokenSource);
        }

        public static Task<string> DeployContractAsync(Nethereum.Web3.Web3 web3, GrowrPondDeployment growrPondDeployment)
        {
            return web3.Eth.GetContractDeploymentHandler<GrowrPondDeployment>().SendRequestAsync(growrPondDeployment);
        }

        public static async Task<GrowrPondService> DeployContractAndGetServiceAsync(Nethereum.Web3.Web3 web3, GrowrPondDeployment growrPondDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            var receipt = await DeployContractAndWaitForReceiptAsync(web3, growrPondDeployment, cancellationTokenSource);
            return new GrowrPondService(web3, receipt.ContractAddress);
        }

        protected Nethereum.Web3.Web3 Web3{ get; }

        public ContractHandler ContractHandler { get; }

        public GrowrPondService(Nethereum.Web3.Web3 web3, string contractAddress)
        {
            Web3 = web3;
            ContractHandler = web3.Eth.GetContractHandler(contractAddress);
        }

        public Task<string> BorrowRequestAsync(BorrowFunction borrowFunction)
        {
             return ContractHandler.SendRequestAsync(borrowFunction);
        }

        public Task<TransactionReceipt> BorrowRequestAndWaitForReceiptAsync(BorrowFunction borrowFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(borrowFunction, cancellationToken);
        }

        public Task<string> BorrowRequestAsync(BigInteger amount)
        {
            var borrowFunction = new BorrowFunction();
                borrowFunction.Amount = amount;
            
             return ContractHandler.SendRequestAsync(borrowFunction);
        }

        public Task<TransactionReceipt> BorrowRequestAndWaitForReceiptAsync(BigInteger amount, CancellationTokenSource cancellationToken = null)
        {
            var borrowFunction = new BorrowFunction();
                borrowFunction.Amount = amount;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(borrowFunction, cancellationToken);
        }

        public Task<string> DepositRequestAsync(DepositFunction depositFunction)
        {
             return ContractHandler.SendRequestAsync(depositFunction);
        }

        public Task<TransactionReceipt> DepositRequestAndWaitForReceiptAsync(DepositFunction depositFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(depositFunction, cancellationToken);
        }

        public Task<string> DepositRequestAsync(BigInteger amount)
        {
            var depositFunction = new DepositFunction();
                depositFunction.Amount = amount;
            
             return ContractHandler.SendRequestAsync(depositFunction);
        }

        public Task<TransactionReceipt> DepositRequestAndWaitForReceiptAsync(BigInteger amount, CancellationTokenSource cancellationToken = null)
        {
            var depositFunction = new DepositFunction();
                depositFunction.Amount = amount;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(depositFunction, cancellationToken);
        }

        public Task<GetBorrowerStatsOutputDTO> GetBorrowerStatsQueryAsync(GetBorrowerStatsFunction getBorrowerStatsFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<GetBorrowerStatsFunction, GetBorrowerStatsOutputDTO>(getBorrowerStatsFunction, blockParameter);
        }

        public Task<GetBorrowerStatsOutputDTO> GetBorrowerStatsQueryAsync(string borrower, BlockParameter blockParameter = null)
        {
            var getBorrowerStatsFunction = new GetBorrowerStatsFunction();
                getBorrowerStatsFunction.Borrower = borrower;
            
            return ContractHandler.QueryDeserializingToObjectAsync<GetBorrowerStatsFunction, GetBorrowerStatsOutputDTO>(getBorrowerStatsFunction, blockParameter);
        }

        public Task<BigInteger> GetLenderAccInterestQueryAsync(GetLenderAccInterestFunction getLenderAccInterestFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<GetLenderAccInterestFunction, BigInteger>(getLenderAccInterestFunction, blockParameter);
        }

        
        public Task<BigInteger> GetLenderAccInterestQueryAsync(string returnValue1, BlockParameter blockParameter = null)
        {
            var getLenderAccInterestFunction = new GetLenderAccInterestFunction();
                getLenderAccInterestFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryAsync<GetLenderAccInterestFunction, BigInteger>(getLenderAccInterestFunction, blockParameter);
        }

        public Task<BigInteger> GetLenderBalanceQueryAsync(GetLenderBalanceFunction getLenderBalanceFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<GetLenderBalanceFunction, BigInteger>(getLenderBalanceFunction, blockParameter);
        }

        
        public Task<BigInteger> GetLenderBalanceQueryAsync(string returnValue1, BlockParameter blockParameter = null)
        {
            var getLenderBalanceFunction = new GetLenderBalanceFunction();
                getLenderBalanceFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryAsync<GetLenderBalanceFunction, BigInteger>(getLenderBalanceFunction, blockParameter);
        }

        public Task<BigInteger> GetLenderIndexQueryAsync(GetLenderIndexFunction getLenderIndexFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<GetLenderIndexFunction, BigInteger>(getLenderIndexFunction, blockParameter);
        }

        
        public Task<BigInteger> GetLenderIndexQueryAsync(string returnValue1, BlockParameter blockParameter = null)
        {
            var getLenderIndexFunction = new GetLenderIndexFunction();
                getLenderIndexFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryAsync<GetLenderIndexFunction, BigInteger>(getLenderIndexFunction, blockParameter);
        }

        public Task<GetLenderStatsOutputDTO> GetLenderStatsQueryAsync(GetLenderStatsFunction getLenderStatsFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<GetLenderStatsFunction, GetLenderStatsOutputDTO>(getLenderStatsFunction, blockParameter);
        }

        public Task<GetLenderStatsOutputDTO> GetLenderStatsQueryAsync(string lender, BlockParameter blockParameter = null)
        {
            var getLenderStatsFunction = new GetLenderStatsFunction();
                getLenderStatsFunction.Lender = lender;
            
            return ContractHandler.QueryDeserializingToObjectAsync<GetLenderStatsFunction, GetLenderStatsOutputDTO>(getLenderStatsFunction, blockParameter);
        }

        public Task<GetLoanOutputDTO> GetLoanQueryAsync(GetLoanFunction getLoanFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<GetLoanFunction, GetLoanOutputDTO>(getLoanFunction, blockParameter);
        }

        public Task<GetLoanOutputDTO> GetLoanQueryAsync(string returnValue1, BlockParameter blockParameter = null)
        {
            var getLoanFunction = new GetLoanFunction();
                getLoanFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryDeserializingToObjectAsync<GetLoanFunction, GetLoanOutputDTO>(getLoanFunction, blockParameter);
        }

        public Task<string> LendersQueryAsync(LendersFunction lendersFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<LendersFunction, string>(lendersFunction, blockParameter);
        }

        
        public Task<string> LendersQueryAsync(BigInteger returnValue1, BlockParameter blockParameter = null)
        {
            var lendersFunction = new LendersFunction();
                lendersFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryAsync<LendersFunction, string>(lendersFunction, blockParameter);
        }

        public Task<PondOutputDTO> PondQueryAsync(PondFunction pondFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<PondFunction, PondOutputDTO>(pondFunction, blockParameter);
        }

        public Task<PondOutputDTO> PondQueryAsync(BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<PondFunction, PondOutputDTO>(null, blockParameter);
        }

        public Task<string> RepayRequestAsync(RepayFunction repayFunction)
        {
             return ContractHandler.SendRequestAsync(repayFunction);
        }

        public Task<TransactionReceipt> RepayRequestAndWaitForReceiptAsync(RepayFunction repayFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(repayFunction, cancellationToken);
        }

        public Task<string> RepayRequestAsync(BigInteger amount)
        {
            var repayFunction = new RepayFunction();
                repayFunction.Amount = amount;
            
             return ContractHandler.SendRequestAsync(repayFunction);
        }

        public Task<TransactionReceipt> RepayRequestAndWaitForReceiptAsync(BigInteger amount, CancellationTokenSource cancellationToken = null)
        {
            var repayFunction = new RepayFunction();
                repayFunction.Amount = amount;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(repayFunction, cancellationToken);
        }

        public Task<string> WithdrawRequestAsync(WithdrawFunction withdrawFunction)
        {
             return ContractHandler.SendRequestAsync(withdrawFunction);
        }

        public Task<TransactionReceipt> WithdrawRequestAndWaitForReceiptAsync(WithdrawFunction withdrawFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(withdrawFunction, cancellationToken);
        }

        public Task<string> WithdrawRequestAsync(BigInteger wPrincipal, BigInteger wInterest)
        {
            var withdrawFunction = new WithdrawFunction();
                withdrawFunction.WPrincipal = wPrincipal;
                withdrawFunction.WInterest = wInterest;
            
             return ContractHandler.SendRequestAsync(withdrawFunction);
        }

        public Task<TransactionReceipt> WithdrawRequestAndWaitForReceiptAsync(BigInteger wPrincipal, BigInteger wInterest, CancellationTokenSource cancellationToken = null)
        {
            var withdrawFunction = new WithdrawFunction();
                withdrawFunction.WPrincipal = wPrincipal;
                withdrawFunction.WInterest = wInterest;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(withdrawFunction, cancellationToken);
        }
    }
}
