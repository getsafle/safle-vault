const cryptojs = require('crypto-js');
const safleAssetController = require('@getsafle/asset-controller');

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

async function removeEmptyAccounts(indexAddress, keyringInstance, vaultState, web3, rpcURL) {
  const keyring = keyringInstance.getKeyringsByType(vaultState.keyrings[0].type);

  let zeroCounter = 0;
  let accountsArray = [];

  accountsArray.push({ address: indexAddress, isDeleted: false });

  do {
    zeroCounter = 0;
    for(let i=0; i < 5; i++) {
      const vaultState = await keyringInstance.addNewAccount(keyring[0]);
  
      const nonce = await getNonce(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], web3);

      const tokens = await getTokens({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], rpcURL });

      const ethBalance = await getEthBalance(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], web3);
  
      if (nonce === 0 && tokens.length === 0 && ethBalance === '0') {
        accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: true });
        zeroCounter++;
      } else {
        accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: false });
        zeroCounter = 0;
      }
    }
  }
  while (zeroCounter < 5 )

  return accountsArray;
}

async function getTokens({ address, rpcURL }) {
  const assetController = new safleAssetController.AssetController({ address, rpcURL });

  const tokens = await assetController.detectTokens();

  return tokens
}

async function getNonce(address, web3) {
  const nonce = await web3.eth.getTransactionCount(address);

  return nonce
}

async function getEthBalance(address, web3) {
  const ethBalance = await web3.eth.getBalance(address);

  return ethBalance
}

async function getCoinInstance(chain) {
  const keyringInstance = new Chains[chain]({ });

  return keyringInstance;
}

module.exports = { stringToArrayBuffer, generatePrivData, removeEmptyAccounts, getCoinInstance };
