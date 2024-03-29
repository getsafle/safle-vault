const cryptojs = require('crypto-js');
const safleTransactionController = require('@getsafle/transaction-controller');
const Web3 = require('web3');

const Chains = require('../chains');
const ERROR_MESSAGE = require('../constants/responses');

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


async function removeEmptyAccounts(indexAddress, keyringInstance, vaultState, unmarshalApiKey, recoverMechanism, logs) {
  
  const keyring = keyringInstance.getKeyringsByType(vaultState.keyrings[0].type);

  let zeroCounter = 0;
  let accountCheckList = [];
  let accountsArray = [];
  accountsArray.push({ address: indexAddress, isDeleted: false, isImported: false, label: 'Wallet 1' });
  accountCheckList.push(indexAddress)
  let labelCounter = 2;  // as an initial wallet is already created above with label 'Wallet 1'
  const chains = Object.keys(Chains.evmChains);

  let newAccountAddr = indexAddress

  if( recoverMechanism === 'logs'){
    for(let i=0; i < logs.length; i++){
      if (logs[i].action === 'add-account' && (chains.includes(logs[i].chain) || logs[i].chain === undefined)){
        if (accountCheckList.includes(newAccountAddr)) {
          vaultState = await keyringInstance.addNewAccount(keyring[0]);
          newAccountAddr = Web3.utils.toChecksumAddress(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1])
        }
        
        if (logs[i].address.toLowerCase() !== newAccountAddr.toLowerCase() && !accountCheckList.includes(logs[i].address.toLowerCase())) {
          do {
            const label = this.createWalletLabels('all', labelCounter);
            accountsArray.push({ address: newAccountAddr.toLowerCase(), isDeleted: false, isImported: false, label, isExported: false });
            accountCheckList.push(newAccountAddr.toLowerCase())
            labelCounter++;
            let vaultState = await keyringInstance.addNewAccount(keyring[0]);
            newAccountAddr = Web3.utils.toChecksumAddress(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1])
          }
          while(logs[i].address.toLowerCase() !== newAccountAddr.toLowerCase() && !accountCheckList.includes(logs[i].address.toLowerCase()))
        }
        
        if (logs[i].address.toLowerCase() === newAccountAddr.toLowerCase()) {
          const label = this.createWalletLabels('all', labelCounter);
          accountsArray.push({ address: newAccountAddr.toLowerCase(), isDeleted: false, isImported: false, label, isExported: false });
          accountCheckList.push(newAccountAddr.toLowerCase())
          labelCounter++;
        }
        
      }
      if(logs[i].action === 'delete-account' && (chains.includes(logs[i].chain) || logs[i].chain === undefined)) {
        let ind = accountsArray.findIndex((acc) => acc.address === Web3.utils.toChecksumAddress(logs[i].address))
        ind >= 0 ? accountsArray[ind].isDeleted = true : false;
      }
    }

  } else if( recoverMechanism === 'transactions'){
    do {
      zeroCounter = 0;
      for(let i=0; i < 5; i++) {
        const vaultState = await keyringInstance.addNewAccount(keyring[0]);
  
        const ethActivity = await getETHTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'ethereum', unmarshalApiKey);
        const polygonActivity = await getPolygonTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'polygon', unmarshalApiKey);
        const bscActivity = await getBSCTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'bsc', unmarshalApiKey);
        const label = this.createWalletLabels('all', i+2);
  
        if (!ethActivity && !polygonActivity && !bscActivity) {
          accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: true, isImported: false, label, isExported: false });
          zeroCounter++;
        } else {
          accountsArray.push({ address: vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], isDeleted: false, isImported: false, label, isExported: false });
          zeroCounter = 0;
        }
      }
    }
  
    while (zeroCounter < 5 )
  }
  return accountsArray;
}

async function  getAccountsFromLogs(keyringInstance, vaultState, recoverMechanism, logs) {

  //if mech = transaction - generate one acc for bitcoin
  
  let accountsArray = [];
  let accountCheckList = [];
  let {address} = await keyringInstance.addAccount();
  const label = this.createWalletLabels('bitcoin', 1);
  accountsArray.push({ address: address, isDeleted: false, isImported: false, label, isExported: false });
  accountCheckList.push(address)
  let labelCounter = 2;
  const chains = Object.keys(Chains.nonEvmChains);

  if( recoverMechanism === 'logs'){
    for(let i=0; i < logs.length; i++){
      if (logs[i].action === 'add-account' && (chains.includes(logs[i].chain))){

        if (accountCheckList.includes(address)) {
          address = (await keyringInstance.addAccount()).address;
        }
        
        if (logs[i].address.toLowerCase() !== address.toLowerCase() && !accountCheckList.includes(logs[i].address.toLowerCase())) {
          do {
            const label = this.createWalletLabels('bitcoin', labelCounter);
            accountsArray.push({ address: address.toLowerCase(), isDeleted: false, isImported: false, label, isExported: false });
            accountCheckList.push(address.toLowerCase())
            labelCounter++;
            address  = (await keyringInstance.addAccount()).address;
          }
          while(logs[i].address.toLowerCase() !== address.toLowerCase() && !accountCheckList.includes(logs[i].address.toLowerCase()))
        }
        
        if (logs[i].address.toLowerCase() === address.toLowerCase()) {
          const label = this.createWalletLabels('bitcoin', labelCounter);
          accountsArray.push({ address: address.toLowerCase(), isDeleted: false, isImported: false, label, isExported: false });
          accountCheckList.push(address.toLowerCase())
          labelCounter ++;
        }
        
      }
      if(logs[i].action === 'delete-account' && (chains.includes(logs[i].chain))) {
        let ind = accountsArray.findIndex((acc) => acc.address.toLowerCase() === logs[i].address.toLowerCase())
        ind >= 0 ? accountsArray[ind].isDeleted = true : false;
      }
    }
  }
  return accountsArray;
}

async function getETHTransactions(address, network, unmarshalApiKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: unmarshalApiKey });

  if (transactions.length > 0) {
    return true;
  }

  return false;
}

async function getPolygonTransactions(address, network, unmarshalApiKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: unmarshalApiKey });

  if (transactions.length > 0) {
    return true;
  }

  return false;
}

async function getBSCTransactions(address, network, unmarshalApiKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: unmarshalApiKey });

  if (transactions.length > 0) {
    return true;
  }

  return false;
}

async function getCoinInstance(chain, mnemonic) {
  if(Chains.evmChains.hasOwnProperty(chain)) {
    const keyringInstance = new Chains[chain].KeyringController({ });
  
    return keyringInstance;
  }

  const keyringInstance = new Chains[chain].KeyringController({ mnemonic });
  
  return keyringInstance;
}

async function cryptography(data, key, action) {
  let output;

  if (action === 'encryption') {
    output = cryptojs.AES.encrypt(data, key).toString();
  } else {
    const bytes = cryptojs.AES.decrypt(data, key);

    output = bytes.toString(cryptojs.enc.Utf8);
  }

  return output;
}

function validateEncryptionKey(data, encryptionKey, encryptor, isCustomEncryptor) {

    const bytes = cryptojs.AES.decrypt(data, encryptionKey);

    let decryptedVault;

    try {
        decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

        return { decryptedVault };
    } catch(error) {
        return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY_OR_VAULT };
    }
  }


function createWalletLabels(labelObj = 'all', walletIndex = 1) {
  let labels = {};

  const chains = Object.keys(Chains.evmChains);
  
  if (labelObj === 'all') {
    chains.forEach(chain => labels[chain] = `${chain.charAt(0).toUpperCase() + chain.substr(1).toLowerCase()} Wallet ${walletIndex}` );
  } 
  else if (labelObj === 'bitcoin') {
    labels = `${labelObj.charAt(0).toUpperCase() + labelObj.substr(1).toLowerCase()} Wallet ${walletIndex}`;
  }
  else {
    chains.forEach(chain => {
      if (labels[chain] !== undefined) {
        labels[chain] = `${chain.charAt(0).toUpperCase() + chain.substr(1).toLowerCase()} Wallet ${walletIndex}`;
      }
    })
  }

  return labels;
}

module.exports = {
  stringToArrayBuffer,
  generatePrivData,
  removeEmptyAccounts,
  getAccountsFromLogs,
  getCoinInstance,
  cryptography,
  validateEncryptionKey,
  createWalletLabels 
};