const CryptoJS = require('crypto-js');
const { KeyringController } = require('@getsafle/vault-eth-controller');
const BitcoinKeyringController= require('@getsafle/vault-bitcoin-controller').KeyringController ;
const bip39 = require('bip39');

const helper = require('../utils/helper');
const Keyring = require('./keyring');
const Chains = require('../chains');

const ERROR_MESSAGE = require('../constants/responses');

class Vault extends Keyring {

    constructor({vault, encryptionKey}) {
        super();
        this.chain = 'ethereum';
        this.vault = vault;
        this.initializeKeyringController();
        if (vault && encryptionKey) {
            this.initializeDecryptedVault(vault, encryptionKey);
        }   
    }

    initializeDecryptedVault(vault, encryptionKey) {
        const { decryptedVault, error }  = helper.validateEncryptionKey(vault, JSON.stringify(encryptionKey));
        if (error) {
            return { error }
        }
        this.decryptedVault = decryptedVault;

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

    async changeNetwork(chain) {
        if (chain !== 'ethereum' && !Chains.evmChains.hasOwnProperty(chain) && !Chains.nonEvmChains.hasOwnProperty(chain)) {
            throw ERROR_MESSAGE.CHAIN_NOT_SUPPORTED;
        }
        this.chain = chain;
    }

    async generateVault(encryptionKey, pin, mnemonic) {
    
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        if(!encryptionKey || pin === undefined || pin === null) {
            return { error: ERROR_MESSAGE.ENTER_CREDS };
        }

        await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const accounts = await this.keyringInstance.getAccounts();

        const privData = await helper.generatePrivData(mnemonic, pin);

        const rawVault = { eth: { public: [ { address: accounts[0], isDeleted: false, isImported: false, label: 'Wallet 1' } ], private: privData, numberOfAccounts: 1 },}

        const vault = await helper.cryptography(JSON.stringify(rawVault), JSON.stringify(encryptionKey), 'encryption');

        this.initializeDecryptedVault(vault, encryptionKey);

        this.vault = vault;

        this.logs.updateState({
            logs: [{ timestamp: Date.now(), action: 'vault-generation', vault: this.vault }],
        });

        return { response: vault };
    }

    async recoverVault(mnemonic, encryptionKey, pin, unmarshalApiKey, recoverMechanism = 'transactions', logs = {}) {

        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }
        
        if (!encryptionKey) {
            return { error : ERROR_MESSAGE.ENTER_CREDS }
        } 

        if(recoverMechanism === 'transactions' && !unmarshalApiKey) { 
            return { error: ERROR_MESSAGE.INVALID_API_KEY };
        }

        const vaultState = await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const accountsArray = await helper.removeEmptyAccounts(vaultState.keyrings[0].accounts[0], this.keyringInstance, vaultState, unmarshalApiKey, recoverMechanism, logs);

        const privData = await helper.generatePrivData(mnemonic, pin);

        const numberOfAccounts = accountsArray.length;

        let rawVault = { eth: { public: accountsArray, private: privData, numberOfAccounts } }


        const activeChains = await this.getActiveChains();

        const evmChainList = Object.keys(Chains.evmChains);

        const filteredChains = activeChains.response.filter(activeChains => !evmChainList.includes(activeChains.chain));

        //generate other chain's keyring instance and get accounts from logs
        let obj = {}
        if (filteredChains.length > 0) {
            for ( let chainData of filteredChains ) {
                const { response: mnemonic } = await this.exportMnemonic(pin);

                const keyringInstance = await helper.getCoinInstance(chainData.chain.toLowerCase(), mnemonic);

                const accArray = await helper.getAccountsFromLogs(keyringInstance, vaultState, recoverMechanism, logs);
                const numberOfAcc = accArray.length;

                rawVault[chainData.chain.toLowerCase()] = { public: accArray, numberOfAcc } 

            }
            
        }

        this.decryptedVault = rawVault

        const vault = await helper.cryptography(JSON.stringify(rawVault), JSON.stringify(encryptionKey), 'encryption');

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'vault-recovery', vault: this.vault });

        return { response: vault };
    }

    getSupportedChains() {
        const evmChains = Chains.evmChains;
        const nonEvmChains = Chains.nonEvmChains;

        return { response: { evmChains, nonEvmChains } };
    }
}

module.exports = Vault