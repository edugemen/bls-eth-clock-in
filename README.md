# Worker clock in for POS blockchains

## Overview

This projects helps to keep track of the workers that are doing their job and have a proof of that. I used BLS encryption to make an aggregated signature of every workers period signature.

This is the sequence diagram of the project:

![UML sequence diagram of the code](https://www.linkpicture.com/q/bls-eth-clock-in-diagram.png)

There should be 2 roles that can be switching: workers and validators. Validators are the ones that interact with the eth blockchain by enabling periods and aggregating signatures. Workers just have to clock in every period.

### setupWorker()

This function adds the worker to both WorkerClockIn and WorkerProofs contracts. It stores their id in the contract and their public key.

```Solidity
struct Worker {
    uint256 id;
    uint256[2] pk;
}
```

### enablePeriod()

This functions is called by the validator. It makes it possible for workers to clock in the period that has been validated. In this project, the period is a day, but it can be changed easily

### clockIn()

The worker calls this function each period to send a signature of the period that is going to be stored in the ethermint's contract.

```Solidity
struct PeriodWorked {
    bool isActive;
    mapping(uint => bool) hasWorked;
    uint256[] workerIds;
    uint256[] signatures;
}
```

### aggregatePeriod()

The validator gets all the signatures of the current period and stores them in WorkerProofs contract.

```Solidity
struct PeriodProof {
    uint256 aggSign;
    uint256[] workerIds;
}
```

### verifySignature()

Finally, every worker can verify the signature of any period by using this function. It uses a BLS contract made by https://github.com/kilic/evmbls.git.

## Instalation

We are going to use ethermint (for the clock in side), ganache (to test the ethereum side) and truffle (to compile and migrate the contracs).

First, we need to install all the programs:

- Ethermint: https://docs.ethermint.zone/quickstart/installation.html
- Ganache: https://www.trufflesuite.com/docs/ganache/quickstart
- Truffle: https://www.trufflesuite.com/docs/truffle/quickstart

Then, we need to clone this github to get all the code.

Finally, you need to migrate all the projects, copy each address that it gives you and paste them in the correct line.

```Typescript
var BLS = new web3Ganache.eth.Contract(blsABI.abi, '0x5fd4Ae53bf893006Ed13b56D67b93Cc06E2e9dDA');
BLS.options.gas = 5000000
var WorkerProofs = new web3Ganache.eth.Contract(wpABI.abi, '0x27aBceBc25ce4a3F3aeBC83Cb8B76705A069120d')
WorkerProofs.options.gas = 5000000
var WorkerClockIn = new web3Ethermint.eth.Contract(wciABI.abi, '0xF3709DE8E86e2158d6530e0abC60d9A969A349f2')
WorkerClockIn.options.gasPrice = 1
WorkerClockIn.options.gas = 5000000
```

There is a video tutorial here: https://youtu.be/QnFehd40sGk

### Extra

When initializing ethermint, you must add to the second command `--rcp-api eth,net,web3,personal,admin`

You can add it to the init.sh so you dont forget:

```Bash
echo -e "ethermintcli rest-server --laddr \"tcp://localhost:8545\" --unlock-key $KEY --chain-id $CHAINID --trust-node --rcp-api eth,net,web3,personal,admin --unsafe-cors --trace\n"
```
