using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Numerics;
using Nethereum.Hex.HexTypes;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace GrowrCoreProtocol.Contracts.GrowrPond.ContractDefinition
{
    public partial class LoanStats : LoanStatsBase { }

    public class LoanStatsBase 
    {
        [Parameter("address", "token", 1)]
        public virtual string Token { get; set; }
        [Parameter("uint256", "issuedAt", 2)]
        public virtual BigInteger IssuedAt { get; set; }
        [Parameter("uint256", "totalDebt", 3)]
        public virtual BigInteger TotalDebt { get; set; }
        [Parameter("uint256", "principal", 4)]
        public virtual BigInteger Principal { get; set; }
        [Parameter("uint256", "totalPondSize", 5)]
        public virtual BigInteger TotalPondSize { get; set; }
        [Parameter("uint256", "lastDisbursedAt", 6)]
        public virtual BigInteger LastDisbursedAt { get; set; }
        [Parameter("uint256", "repaidInterest", 7)]
        public virtual BigInteger RepaidInterest { get; set; }
        [Parameter("bool", "exists", 8)]
        public virtual bool Exists { get; set; }
    }
}
