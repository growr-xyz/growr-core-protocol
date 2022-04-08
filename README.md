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

Manual deploy
$ npm run script:dev:mint-tokens

Deploy contracts only
$ npm run script:dev:deploy-protocol
```

### Useful scripts (RSK TestNet)
```
Configure private key in hardhat.config.js: networks.rskTestNet.accounts

Deploy protocol on RSK TestNet
$ npx hardhat run --network rskTestNet scripts/dev/deploy-protocol.js

Create tokens
$ npx hardhat run --network rskTestNet scripts/dev/mint-tokens.js

```
