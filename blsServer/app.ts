import { BigNumber } from "ethers";

const bls = require("@chainsafe/bls")
const Web3 = require('web3');
const http = require('http');
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const mcl = require('./utils/mcl')
const utils = require('./utils/utils')
import fs from 'fs';

// create application/json parser
app.use(bodyParser.json())

//Datos del nodo
var keyPair

//Cuentas para pruebas
interface BLSKeyPair{
  secret: any,
  pubkey: any
}

interface User {
  blsKeyPair: BLSKeyPair,
  ethAccount: any,
  emAccount: any
}

var nodeUser: User;

//Interfaces utiles
interface emWorkerData{
  worker: string,
  pk: number[],
  signature: number[]
  message: number[]
}

const keysUrl = 'keys/keys.json';

//web3 connections
let web3Ganache = new Web3(Web3.givenProvider || "ws://localhost:7545");
let web3Ethermint = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

web3Ganache.eth.defaultAccount = web3Ganache.eth.accounts[0];

const blsABI = require("../abis/BLS.json")
const wciABI = require("../abis/WorkerClockIn.json")
const wpABI = require("../abis/WorkerProofs.json")

var BLS = new web3Ganache.eth.Contract(blsABI.abi, '0x5fd4Ae53bf893006Ed13b56D67b93Cc06E2e9dDA');
BLS.options.gas = 5000000
var WorkerProofs = new web3Ganache.eth.Contract(wpABI.abi, '0x27aBceBc25ce4a3F3aeBC83Cb8B76705A069120d')
WorkerProofs.options.gas = 5000000
var WorkerClockIn = new web3Ethermint.eth.Contract(wciABI.abi, '0xF3709DE8E86e2158d6530e0abC60d9A969A349f2')
WorkerClockIn.options.gasPrice = 1
WorkerClockIn.options.gas = 5000000

//Initializes user keys 
async function iniUsuario() {

  fs.readFile(keysUrl, 'utf8', async (err,data) => {
    if(err){
      let ganacheAccounts = await web3Ganache.eth.personal.getAccounts()
      let ethermintAccounts = await web3Ethermint.eth.personal.getAccounts()

      let keyPair:BLSKeyPair = mcl.newKeyPair()

      let ethAc = ganacheAccounts[0];
      //web3Ganache.personal.unlockAccount(ethAc,"<password>", 15000)
      let emAc = ethermintAccounts[0];
      //web3Ethermint.personal.unlockAccount(emAc,"<password>", 15000)

      let usuario = {secretK:Array.from(keyPair.secret.a_), publicK:Array.from(keyPair.pubkey.a_), ethAccount:ethAc, emAccount:emAc}

      var json = JSON.stringify(usuario);

      fs.writeFile(keysUrl, json, 'utf8', () => {
        let usuarioC:User = {
          blsKeyPair: keyPair,
          emAccount:emAc,
          ethAccount:ethAc
        }
  
        nodeUser = usuarioC

        console.log('Credenciales guardadas en "' + keysUrl + '"')
      })

    }else{
      let obj = JSON.parse(data);

      let publicK = Uint32Array.from(obj.publicK)
      let secretK = Uint32Array.from(obj.secretK)

      let pK = mcl.newG2();
      pK.a_ = publicK;

      let sK = mcl.newFr();
      sK.a_ = secretK;

      let usuario:User = {
        blsKeyPair: {
          secret:sK, 
          pubkey:pK
        },
        emAccount:obj.emAccount,
        ethAccount:obj.ethAccount
      }

      nodeUser = usuario

      console.log('Usuario cargado')
    }
  })

}

//It returns the UTC date like dd-MM-yyyy
function getUTCDate():string {
  let today = new Date();

  let tDay = today.getUTCDate();
  let tMonth = today.getUTCMonth() + 1;
  let tYear = today.getUTCFullYear();

  let sToday = tDay + "-" + (tMonth<10 ? "0"+tMonth : tMonth) + "-" + tYear

  return sToday;
}

//G1 to BigNumber converter
function g1ToBN(n:any):BigNumber {
  let hex = n.serializeToHexStr();

  let res = BigNumber.from("0x" + hex)

  return res;
}

//BigNumber to G1 converter
function bnToG1(n:BigNumber) {
  let g1 = mcl.newG1()

  g1.deserializeHexStr(n._hex.substring(2))

  return g1;
}

//G2 to BigNumber converter
function g2ToBN(n:any):BigNumber[] {
  let hex = n.serializeToHexStr();

  let hex1 = hex.substring(0, hex.length/2)
  let hex2 = hex.substring(hex.length/2, hex.length)

  let res1 = BigNumber.from("0x" + hex1)
  let res2 = BigNumber.from("0x" + hex2)

  return [res1,res2];
}

//BigNumber to G1 converter
function bnToG2(n:BigNumber[]) {
  let g2 = mcl.newG2()

  let hex = n[0]._hex.substring(2).concat(n[1]._hex.substring(2))

  g2.deserializeHexStr(hex)

  return g2;
}

//Signs a message
function signMessage(message:string) {
  mcl.setMappingMode(mcl.MAPPING_MODE_TI);
  mcl.setDomain('testing evmbls');

  const { signature, M } = mcl.sign(message, nodeUser.blsKeyPair.secret);

  return {
    "g1Message":M,
    "g1Signature":signature
  }

}

app.listen(port, async () => {
  await mcl.init();
  mcl.setDomain('testing-evmbls');
  await iniUsuario()
  console.log(`blsServer started at http://localhost:${port}`)
})

//The worker adds himself to the ethermint and the ethereum contract
app.post('/setupWorker', async (req,res) => {
  let bnPK = g2ToBN(nodeUser.blsKeyPair.pubkey)

  try{
    var resultado = await WorkerClockIn.methods.setupWorker(nodeUser.ethAccount, bnPK).send({from:nodeUser.emAccount})
    resultado = await WorkerProofs.methods.setupWorker(bnPK).send({from:nodeUser.ethAccount})

    res.send(resultado)
  }catch(err){
    res.status(500).send(err)
  }
})

//The validator enables the new period
app.post('/enablePeriod', async (req,res) => {
  let date = req.body.date;

  let hDay = Web3.utils.utf8ToHex(date)
  let data = signMessage(hDay)
  let bnMessage = g1ToBN(data.g1Message)

  try{
    var resultado = await WorkerClockIn.methods.nextPeriod(bnMessage).send({from:nodeUser.emAccount})
    res.send(resultado)
  }catch(err){
    res.status(500).send(err)
  }
})

//The worker clocks in the ethermint contract
app.post('/clockIn', async (req,res) => {
  var day = getUTCDate();
  let hDay = Web3.utils.utf8ToHex(day)
  let data = signMessage(hDay)

  let bnMessage = g1ToBN(data.g1Message)
  let bnSignature = g1ToBN(data.g1Signature)

  try{
    var resultado = await WorkerClockIn.methods.clockIn(nodeUser.ethAccount, bnSignature, bnMessage).send({from:nodeUser.emAccount})
    res.send(resultado)
  }catch(err){
    res.status(500).send(err)
  }
})

//The validator get all the signatures, aggregates them and he send it to the Ethereum chain
app.post("/aggregatePeriod", async (req,res) => {
  mcl.setMappingMode(mcl.MAPPING_MODE_TI);
  mcl.setDomain('testing evmbls');

  var day = getUTCDate();
  let hDay = Web3.utils.utf8ToHex(day)
  let data = signMessage(hDay)

  let BNMessage = g1ToBN(data.g1Message)

  try{
    var emWorkers = await WorkerClockIn.methods.getSignatures(BNMessage).call({from:nodeUser.emAccount})

    let workers = emWorkers[2]
    let workedIds = emWorkers[0]
    let workedSign = emWorkers[1]

    var acc = mcl.newG1();
    var pubkeys = [];

    for(let i = 0; i<workedIds.length; i++) {
      let signature = bnToG1(BigNumber.from(workedSign[i]))
      acc = mcl.aggreagate(acc, signature)
      let workerId = workedIds[i]
      let pk = workers[workerId-1][1]
      pubkeys.push([BigNumber.from(pk[0]),BigNumber.from(pk[1])])
    }

    let sig_agg_bn = g1ToBN(acc)

    try{
      var resultado = await WorkerProofs.methods.addSign(BNMessage, sig_agg_bn, workedIds).send({from:nodeUser.ethAccount})

      res.send(resultado)
    }catch(err){
      res.status(500).send(err)
    }
  }catch(err){
    res.status(500).send(err)
  }

})

//Verify the aggregated signature of a period. We use a date in the format dd-MM-yyyy.
app.post('/verifySignature', async (req,res) => {
  let date = req.body.date

  let hDay = Web3.utils.utf8ToHex(date)
  let data = signMessage(hDay)
  let BNMessage = g1ToBN(data.g1Message)

  try{
    var dayWorked = await WorkerProofs.methods.getAggSign(BNMessage).call({from:nodeUser.ethAccount})

    let workers = dayWorked[0]
    let workedIds = dayWorked[1][1]
    let workedSign = dayWorked[1][0]
  
    let aggSign = bnToG1(BigNumber.from(workedSign))
    let publickeys = []
    let messages = []
  
    for(let i = 0; i<workedIds.length; i++){
      let workerId = workedIds[i]
      let pk = workers[workerId-1][1]
      pk = bnToG2([BigNumber.from(pk[0]),BigNumber.from(pk[1])])
      publickeys.push(mcl.g2ToBN(pk))
      messages.push(mcl.g1ToBN(data.g1Message))
    }
  
    let bnAggSign = mcl.g1ToBN(aggSign)
  
    try{
      var resultado = await BLS.methods.verifyMultiple(bnAggSign, publickeys, messages).send({from:nodeUser.ethAccount})

      res.send(resultado)
    }catch(err){
      res.status(500).send(err)
    }
  }catch(err){
    res.status(500).send(err)
  }

  
})

app.get('/getSignatures', async (req,res) => {
  const period = req.body.period

  let hDay = Web3.utils.utf8ToHex(period)
  let data = signMessage(hDay)
  let BNMessage = g1ToBN(data.g1Message)

  var resultado = await WorkerClockIn.methods.getSignatures(BNMessage).call({from:nodeUser.emAccount})

  if(resultado){
    res.status(200).send(resultado)
  }else{
    res.status(500).send({"status":false})
  }
})

