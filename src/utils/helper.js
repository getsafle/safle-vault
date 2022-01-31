const cryptojs = require('crypto-js');
const safleTransactionController = require('@getsafle/transaction-controller');
const Web3 = require('web3');

const Chains = require('../chains');

async function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(32);
  const bufView = new Uint16Array(buf);

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

async function generatePrivData(mnemonic, pin) {
  var priv = {};

  const encryptedMnemonic = cryptojs.AES.encrypt(mnemonic, pin).toString();

  priv.encryptedMnemonic = encryptedMnemonic;

  return priv;
}

async function removeEmptyAccounts(indexAddress, keyringInstance, vaultState, rpcURL, etherscanApiKey, polygonscanApiKey) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

  const keyring = keyringInstance.getKeyringsByType(vaultState.keyrings[0].type);

  let zeroCounter = 0;
  let accountsArray = [];

  accountsArray.push({ address: indexAddress, isDeleted: false, isImported: false });

  let network;

  await web3.eth.net.getNetworkType().then((e) => network = e);

  network = network === 'main' ? network = 'mainnet' : network;

  do {
    zeroCounter = 0;
    for(let i=0; i < 5; i++) {
      const vaultState = await keyringInstance.addNewAccount(keyring[0]);

      const ethActivity = await getETHTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], network, etherscanApiKey);
      const polygonActivity = await getPolygonTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'polygon-mainnet', polygonscanApiKey);

      if (!ethActivity && !polygonActivity) {
        accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: true, isImported: false });
        zeroCounter++;
      } else {
        accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: false, isImported: false });
        zeroCounter = 0;
      }
    }
  }

  while (zeroCounter < 5 )

  return accountsArray;
}

async function getETHTransactions(address, network, etherscanAPIKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: etherscanAPIKey });

  if (transactions.length > 0) {
    return true;
  }

  return false;
}

async function getPolygonTransactions(address, network, polygonscanAPIKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: polygonscanAPIKey });

  if (transactions.length > 0) {
    return true;
  }

  return false;
}

async function getCoinInstance(chain, mnemonic) {
  if(Chains.evmChains.includes(chain)) {
    const keyringInstance = new Chains[chain]({ });
  
    return keyringInstance;
  }

  const keyringInstance = new Chains[chain]({ mnemonic });
  
  return keyringInstance;
}

module.exports = { stringToArrayBuffer, generatePrivData, removeEmptyAccounts, getCoinInstance };
