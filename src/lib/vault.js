const CryptoJS = require('crypto-js');
const KeyringController = require('eth-keyring-controller');
const Web3 = require('web3');
const helper = require('../utils/helper');
const Keyring = require('./keyring');

const { 
    INVALID_PERSIST_LOCATION,
} = require('../constants/responses')

let mobilePersist;
let browserPersist;

class Vault extends Keyring {

    constructor(rpcURL) {
        super();
        this.rpcURL = rpcURL;
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
        this.initializeKeyringController()
    }

    initializeKeyringController() {
        const keyringController = new KeyringController({
        encryptor: {
            encrypt(pass, object) {
            const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(object), pass).toString();

            return ciphertext;
            },
            decrypt(pass, encryptedString) {
            const bytes = CryptoJS.AES.decrypt(encryptedString, pass);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

            return decryptedData;
            },
        },
        });

        this.keyringInstance = keyringController;
    }

    async retrieveVault(password, env, authToken, persistLocation) {
        if (persistLocation === 'mobile') {
            return { response: mobilePersist };
        }

        if (persistLocation === 'browser') {
            return { response: browserPersist };
        }

        if (persistLocation === 'cloud') {
            const { error, response } = await helper._retrieveVault({ env, password, authToken });
    
            if (error) {
                return { error };
            }
    
            return { response };
        }

        return { error: INVALID_PERSIST_LOCATION }
    }
}

module.exports = Vault