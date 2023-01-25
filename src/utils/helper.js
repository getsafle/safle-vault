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

async function generatePrivData(mnemonic, pin, encryptor) {
  var priv = {};

  const encryptedMnemonic = encryptor.encrypt(mnemonic, pin.toString()).toString();

  priv.encryptedMnemonic = encryptedMnemonic;

  return priv;
}

async function removeEmptyAccounts(indexAddress, keyringInstance, vaultState, unmarshalApiKey) {
  const keyring = keyringInstance.getKeyringsByType(vaultState.keyrings[0].type);

  let zeroCounter = 0;
  let accountsArray = [];

  

  accountsArray.push({ address: indexAddress, isDeleted: false, isImported: false, label: 'Wallet 1' });

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

async function getBSCTransactions(address, network, bscscanApiKey) {
  const transactionController = new safleTransactionController.TransactionController();

  const transactions = await transactionController.getTransactions({ address, fromBlock: 0, network, apiKey: bscscanApiKey });

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

async function cryptography(data, key, action, encryptor, isCustomEncryptor) {
  let output;

  if (action === 'encryption') {
    output = encryptor.encrypt(data, key).toString();
  } else {
    if (isCustomEncryptor) {
      output = encryptor.decrypt(data, key);
    } else {
      const bytes = cryptojs.AES.decrypt(data, key);

      output = bytes.toString(cryptojs.enc.Utf8);
    }
  }

  return output;
}

async function validateEncryptionKey(data, encryptionKey, encryptor, isCustomEncryptor) {
  if (isCustomEncryptor) {
    try {
      const decryptedVault = encryptor.decrypt(data, encryptionKey);
  
      return { decryptedVault };
    } catch(error) {
        return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY };
    }
  } else {
    const bytes = cryptojs.AES.decrypt(data, encryptionKey);

    let decryptedVault;

    try {
        decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

        return { decryptedVault };
    } catch(error) {
        return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY };
    }
  }
}

function createWalletLabels(labelObj = 'all', walletIndex = 1) {
  let labels = {};

  const chains = Object.keys(Chains.evmChains);
  
  if (labelObj === 'all') {
    chains.forEach(chain => labels[chain] = `${chain.charAt(0).toUpperCase() + chain.substr(1).toLowerCase()} Wallet ${walletIndex}` );
  } else {
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
  getCoinInstance,
  getAssetDetails,
  cryptography,
  validateEncryptionKey,
  createWalletLabels 
};
