# growr-core-protocol
Repo for the smart contracts



#### Development
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
Useful scripts
```
Deploy xUSD Token and distribute X amount to all wallets
$ npm run script:dev:xUSD

Deploy contracts
$ npm run script:dev:deploy

Execute custom script
$ npm run script:dev <path to the script file>
```