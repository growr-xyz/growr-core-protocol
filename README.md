# growr-core-protocol

Repo for the smart contracts

### Development

Clone the repository and install all dependencies

```
$ git clone https://github.com/growr-xyz/growr-core-protocol.git
$ cd ./growr-core-protocol
$ npm install
```

Spin up a local node

```
$ npm run node:local
```

Run sanity check

```
$ npm run test
```

### Useful scripts (localhost)

```
Deploy protocol with initial data
$ npm run script:dev:deploy-and-seed

Deploy contracts only
$ npm run script:dev:deploy-protocol
```

Manual deploy
$ npm run script:dev:mint-tokens


### Useful scripts (RSK TestNet)
```
Configure private key in hardhat.config.js: networks.rskTestNet.accounts

Deploy protocol on RSK TestNet
$ npx hardhat run --network rskTestNet scripts/dev/deploy-protocol.js

Create tokens
$ npx hardhat run --network rskTestNet scripts/dev/mint-tokens.js

```

### Current version of Growr protocol on RSK Testnet is 0.3
VerificationRegistry    : 0xA05A7F9f6aA39d37f3fcE95D4A4ad5D273c0Db6C
PondFactory             : 0x6069A41Ac8d73b7aE193f4890db1E84Df28a6835
WRBTC address           : 0x4e66383618f48666706CcE9eaF5439f141935f58
xUSD address            : 0x7237aD8910561B683c760A29246af14cAA52EEd2
DOC address             : 0x84DF2f71B3d47C70a34dCd1C6E56fCb3a0b87F3C
