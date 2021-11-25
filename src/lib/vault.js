const CryptoJS = require('crypto-js');
const KeyringController = require('@getsafle/vault-eth-controller');
const Web3 = require('web3');
const bip39 = require('bip39');
const SafleId = require('@getsafle/safle-identity-wallet').SafleID;

const helper = require('../utils/helper');
const Keyring = require('./keyring');

const errorMessage = require('../constants/responses')

class Vault extends Keyring {

    constructor(rpcURL, vault) {
        super();
        this.rpcURL = rpcURL;
        this.vault = vault;
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

    async generateMnemonic(entropy) {
        var mnemonic;

        if(entropy) {
            mnemonic = bip39.entropyToMnemonic(entropy);
        } else {
            mnemonic = bip39.generateMnemonic();
        }

        return mnemonic;
    }

    async generateVault(encryptionKey, pin, mnemonic) {
        if(!encryptionKey || !pin) {
            return { error: errorMessage.ENTER_CREDS };
        }

        await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);
    
        const accounts = await this.keyringInstance.getAccounts();

        const privData = await helper.generatePrivData(mnemonic, pin);

        const rawVault = { eth: { public: [ { address: accounts[0], isDeleted: false } ], private: privData, numberOfAccounts: 1 } }
                
        const vault = CryptoJS.AES.encrypt(JSON.stringify(rawVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;
    
        return { response: vault };
    }

    async recoverVault(mnemonic, encryptionKey, pin, safleID) {
        const safle = new SafleId('mainnet');

        const vaultState = await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const safleId = await safle.getSafleId(vaultState.keyrings[0].accounts[0]);
        
        if (safleId === '' || safleId != safleID) {
            return { error: errorMessage.WRONG_MNEMONIC };
        }

        const accountsArray = await helper.removeEmptyAccounts(vaultState.keyrings[0].accounts[0], this.keyringInstance, vaultState, this.web3, this.rpcURL);

        const privData = await helper.generatePrivData(mnemonic, pin);

        const numberOfAccounts = accountsArray.filter(item => item.isDeleted === false).length;

        const rawVault = { eth: { public: accountsArray, private: privData, numberOfAccounts: (numberOfAccounts + 1) } }
                
        const vault = CryptoJS.AES.encrypt(JSON.stringify(rawVault), JSON.stringify(encryptionKey)).toString();
    
        return { response: vault };
    }
}

module.exports = Vault