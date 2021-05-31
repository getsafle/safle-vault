const axios = require('axios');
const jwtDecode = require('jwt-decode');
const crypto = require('crypto');
const cryptojs = require('crypto-js');

const {
    AUTH_SERVICE_URL_PROD,
    AUTH_SERVICE_URL_DEV,
    AUTH_SERVICE_URL_TEST,
} = require('../config');

const {
  INVALID_ENVIRONMENT,
  NONEXISTENT_KEYRING_ACCOUNT,
  RECEPIENT_ADDRESS_NOT_FOUND,
  SENDER_ADDRESS_NOT_FOUND,
} = require('../constants/responses');

async function getBaseUrl(env) {
  if (env === 'test') {
    return { auth: AUTH_SERVICE_URL_TEST };
  } if (env === 'dev') {
    return { auth: AUTH_SERVICE_URL_DEV };
  } if (env === 'prod') {
    return { auth: AUTH_SERVICE_URL_PROD };
  }

  return { error: INVALID_ENVIRONMENT };
}

async function generatePDKeyHash(safleId, password) {
  const passwordDerivedKey = crypto.pbkdf2Sync(safleId, password, 10000, 32, 'sha512');

  const passwordDerivedKeyHash = crypto.createHash('sha512', passwordDerivedKey);

  const passwordDerivedKeyHashHex = passwordDerivedKeyHash.digest('hex');

  return passwordDerivedKeyHashHex;
}

async function postRequest({ params, url, authToken }) {
  try {
    const response = await axios({
      url,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: params,
    });

    return { response: response.data };
  } catch (error) {
    return { error: error.response.data };
  }
}

async function _retrieveVault({ env, password, authToken }) {
  const { auth: AUTH_SERVICE_URL, error: BASE_URL_ERROR } = await getBaseUrl(env);

    if (BASE_URL_ERROR) {
      return { error: BASE_URL_ERROR };
    }

    const { safleId } = jwtDecode(authToken);

    const PDKeyHash = await generatePDKeyHash(safleId, password);

    const url = `${AUTH_SERVICE_URL}/vault/retrieve`;

    const { error, response } = await postRequest({ params: { PDKeyHash }, url, authToken });

    if (error) {
      return { error: error.details };
    }

    return { response: response.data.data.vault };
}

async function decryptVault(vault, password) {

  const bytes = cryptojs.AES.decrypt(vault, password);

  const decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

  return { response: decryptedVault };
}

async function decryptKeyring(encryptedKeyring, password, keyringInstance) {

  const bytes = cryptojs.AES.decrypt(encryptedKeyring.keyring, password);

  const decryptedKeyring = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

  await keyringInstance.restoreKeyring({ type: decryptedKeyring.type, data: { numberOfAccounts: decryptedKeyring.wallets.length, mnemonic: decryptedKeyring.mnemonic } });

  const keyring = await keyringInstance.getKeyringsByType(decryptedKeyring.type);

  return { response: keyring[0] };
}

async function validateTxData(rawTx, keyringInstance) {
  if (!rawTx.to) {
    return { error: RECEPIENT_ADDRESS_NOT_FOUND };
  }

  if (!rawTx.from) {
    return { error: SENDER_ADDRESS_NOT_FOUND };
  }
    
  const accounts = await keyringInstance.getAccounts();
    
  if (accounts.includes(rawTx.from) === false) {
    return { error: NONEXISTENT_KEYRING_ACCOUNT };
  }

  return true;
}

async function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(32);
  const bufView = new Uint16Array(buf);

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

module.exports = { _retrieveVault, decryptVault, decryptKeyring, validateTxData, stringToArrayBuffer }
