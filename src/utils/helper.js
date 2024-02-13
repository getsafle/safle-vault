const cryptojs = require('crypto-js');
const safleTransactionController = require('@getsafle/transaction-controller');
const Web3 = require('web3');
const { AssetController } = require('@getsafle/asset-controller');

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

async function getAccountsFromTransactions(indexAddress, keyringInstance, vaultState, unmarshalApiKey) {
  
  const keyring = keyringInstance.getKeyringsByType(vaultState.keyrings[0].type);

  let zeroCounter = 0;
  let accountsArray = [];
  accountsArray.push({ address: indexAddress, isDeleted: false, isImported: false, label: 'EVM Wallet 1' });

  do {
    zeroCounter = 0;
    for(let i=0; i < 5; i++) {
      const vaultState = await keyringInstance.addNewAccount(keyring[0]);

      const ethActivity = await getETHTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'ethereum', unmarshalApiKey);
      const polygonActivity = await getPolygonTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'polygon', unmarshalApiKey);
      const bscActivity = await getBSCTransactions(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1], 'bsc', unmarshalApiKey);
      const label = this.createWalletLabels('EVM', i+2);

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

  return accountsArray;
}


async function getAccountsFromLogs(chain, chainInstance, vaultState, logs = [], indexAddress) {

  const accountsMap = new Map();
  let generatedAddress = indexAddress;
  let labelCounter = 1;

  // Create a new address based on the blockchain type
  const createNewAddress = async (chain, chainInstance) => {
    let address;
    if (chain === 'ethereum' || chain === undefined) {
      keyring = chainInstance.getKeyringsByType(vaultState.keyrings[0].type);
      vaultState = await chainInstance.addNewAccount(keyring[0]);
      address = (Web3.utils.toChecksumAddress(vaultState.keyrings[0].accounts[vaultState.keyrings[0].accounts.length - 1])).toLowerCase();
    } else {
      address = (await chainInstance.addAccount()).address.toLowerCase();
    }
    return address;
  };

  // Create an account object with a label based on the blockchain type
  const createAccountObject = async (generatedAddress) => {
    const labelPrefix = chain === 'ethereum' || chain === undefined || Chains.evmChains[chain] ? 'EVM' : Chains.nonEvmChains[chain];
    const label = this.createWalletLabels(labelPrefix, labelCounter++);
    return { address: generatedAddress, isDeleted: false, isImported: false, label, isExported: false };
  };

  // If indexAddress is empty, return the values of the accounts map
  if (!indexAddress){
    return [];
  } else {
    // Set the indexAddress account in the accounts map
    accountsMap.set(indexAddress, await createAccountObject(indexAddress));
  }
  if(!logs.length) {
    return Array.from(accountsMap.values());
  }

  // Add account if verified based on the log address
  const addAccountIfVerified = async (logAddress) => {
    if (accountsMap.has(logAddress)) {
      let account = accountsMap.get(logAddress);
      if (account.isDeleted === true) {
        account.isDeleted = false;
      }
    }

    if (accountsMap.has(generatedAddress)) {
      generatedAddress = await createNewAddress(chain, chainInstance);
    }

    while (logAddress !== generatedAddress && !accountsMap.has(logAddress)) {
      accountsMap.set(generatedAddress, await createAccountObject(generatedAddress));
      generatedAddress = await createNewAddress(chain, chainInstance);
    }

    if (logAddress === generatedAddress) {
      accountsMap.set(generatedAddress, await createAccountObject(generatedAddress));
    }
  };

  // Iterate through the logs and update the accounts map accordingly
  for (let log of logs) {
    const logAddress = log?.address?.toLowerCase();
    if (log?.chain === chain || (chain === 'ethereum' && log?.chain === undefined)) {
      if (log.action === 'add-account') {
        await addAccountIfVerified(logAddress);
      }
      else if(log.action === 'restore-account') {
        const account = accountsMap.get(logAddress);
        if (account) {
          account.isDeleted = false;
        }
      } else if (log.action === 'delete-account') {
        const account = accountsMap.get(logAddress);
        if (account) {
          account.isDeleted = true;
        }
      }
    }
  }

  // Return the values of the accounts map as an array
  return Array.from(accountsMap.values());
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

async function getAssetDetails({ addresses, chains, EthRpcUrl, polygonRpcUrl, bscRpcUrl }) {

  let output = { };
  let chainAssets  = [];

  for (let j = 0; j < addresses.length; j++) {
    for (let i = 0; i < chains.length; i++) {

        if (chains[i] === 'ethereum') {
          const assets = await getEthAssets(addresses[j], EthRpcUrl);

          chainAssets.push({ 'ethereum': { ...assets } });
        } else if (chains[i] === 'bsc') {
          const assets = await getBSCAssets(addresses[j], bscRpcUrl);

          chainAssets.push({ 'bsc': { ...assets } });
        } else {
          const assets = await getPolygonAssets(addresses[j], polygonRpcUrl);

          chainAssets.push({ 'polygon': { ...assets } });
        }
      }

      output[addresses[j]] = { ...chainAssets };

      chainAssets = [];
    }

  return output;
}

async function getEthAssets(address, ethRpcUrl) {
  const assetController = new AssetController({ rpcURL: ethRpcUrl, chain: 'ethereum' });

  const tokens = await assetController.detectTokens({ userAddress: address });

  return tokens;
}

async function getPolygonAssets(address, polygonRpcUrl) {
  const assetController = new AssetController({ rpcURL: polygonRpcUrl, chain: 'polygon' });

  const tokens = await assetController.detectTokens({ userAddress: address });

  return tokens;
}

async function getBSCAssets(address, bscRpcUrl) {
  const assetController = new AssetController({ rpcURL: bscRpcUrl, chain: 'bsc' });

  const tokens = await assetController.detectTokens({ userAddress: address });

  return tokens;
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


function createWalletLabels(labelPrefix, walletIndex = 1) {
  let labels = `${labelPrefix} Wallet ${walletIndex}`;
  return labels;
}

module.exports = {
  stringToArrayBuffer,
  generatePrivData,
  getAccountsFromTransactions,
  getAccountsFromLogs,
  getCoinInstance,
  getAssetDetails,
  cryptography,
  validateEncryptionKey,
  createWalletLabels 
};