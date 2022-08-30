Repo for the **Pond** smart contracts

#### Development

Clone the repository and install all dependencies

```
$ git clone https://github.com/growr-xyz/growr-core-protocol.git
$ cd ./growr-core-protocol/Pond
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

Useful scripts

```
Deploy protocol with initial data
$ npm run script:dev:deploy-and-seed

Manual deploy
$ npm run script:dev:mint-tokens

Deploy contracts only
$ npm run script:dev:deploy-protocol
```
