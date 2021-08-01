# Worker clock in for POS blockchains

## Overview

This projects helps to keep track of the workers that are doing their job and have a proof of that. I used BLS encryption to make an aggregated signature of every workers period signature.

This is the sequence diagram of the project:

![UML sequence diagram of the code](https://ibb.co/3dHhkf6)

There should be 2 roles that can be switching: workers and validators. Validators are the ones that interact with the eth blockchain by enabling periods and aggregating signatures. Workers just have to clock in every period.

## Instalation

We are going to use ethermint (for the clock in side), ganache (to test the ethereum side) and truffle (to compile and migrate the contracs).

First, we need to install all the programs:

* Ethermint: https://docs.ethermint.zone/quickstart/installation.html
* Ganache: https://www.trufflesuite.com/docs/ganache/quickstart
* Truffle: https://www.trufflesuite.com/docs/truffle/quickstart

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

