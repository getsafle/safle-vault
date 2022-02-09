const CryptoJS = require('crypto-js');
const KeyringController = require('@getsafle/vault-eth-controller');
const Web3 = require('web3');
const bip39 = require('bip39');

const helper = require('../utils/helper');
const Keyring = require('./keyring');
const Chains = require('../chains');

const errorMessage = require('../constants/responses')

class Vault extends Keyring {

    constructor(rpcURL, vault) {
        super();
        this.rpcURL = rpcURL;
        this.chain = 'ethereum';
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

    async changeNetwork(chain) {
        if (chain !== 'ethereum' && !Chains.evmChains.hasOwnProperty(chain) && !Chains.nonEvmChains.hasOwnProperty(chain)) {
            throw errorMessage.CHAIN_NOT_SUPPORTED;
        }
        this.chain = chain;
    }

    async generateVault(encryptionKey, pin, mnemonic) {
        if(!encryptionKey || !pin) {
            return { error: errorMessage.ENTER_CREDS };
        }

        await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);
    
        const accounts = await this.keyringInstance.getAccounts();

        const privData = await helper.generatePrivData(mnemonic, pin);

        const rawVault = { eth: { public: [ { address: accounts[0], isDeleted: false, isImported: false } ], private: privData, numberOfAccounts: 1 } }
                
        const vault = CryptoJS.AES.encrypt(JSON.stringify(rawVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;

        this.logs.updateState({
            logs: [{ timestamp: Date.now(), action: 'vault-generation', vault: this.vault }],
        });

        return { response: vault };
    }

    async recoverVault(mnemonic, encryptionKey, pin, etherscanApiKey, polygonscanApiKey) {
        const vaultState = await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const accountsArray = await helper.removeEmptyAccounts(vaultState.keyrings[0].accounts[0], this.keyringInstance, vaultState, this.rpcURL, etherscanApiKey, polygonscanApiKey);

        const privData = await helper.generatePrivData(mnemonic, pin);

        const numberOfAccounts = accountsArray.filter(item => item.isDeleted === false).length;

        const rawVault = { eth: { public: accountsArray, private: privData, numberOfAccounts } }
                
        const vault = CryptoJS.AES.encrypt(JSON.stringify(rawVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'vault-recovery', vault: this.vault })
    
        return { response: vault };
    }

    getSupportedChains() {
        const evmChains = Chains.evmChains;
        const nonEvmChains = Chains.nonEvmChains;

        return { response: { evmChains, nonEvmChains } };
    }
}

module.exports = Vault