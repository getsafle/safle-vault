const encryptor = require('crypto-js').AES;
const { KeyringController } = require('@getsafle/vault-eth-controller');
const bip39 = require('bip39');

const helper = require('../utils/helper');
const Keyring = require('./keyring');
const Chains = require('../chains');

const ERROR_MESSAGE = require('../constants/responses');

class Vault extends Keyring {

    constructor({ vault, customEncryptor, platform, storage }) {
        super();
        this.chain = 'ethereum';
        this.platform = platform;
        this.vault = vault || null;
        this.storage = storage;
        this.encryptor = customEncryptor || encryptor;
        this.isCustomEncryptor = customEncryptor ? true : false;
        this.initializeKeyringController()
    }

    initializeKeyringController() {
        const keyringController = new KeyringController({
            encryptor: {
                encrypt(pass, object) {
                    const ciphertext = encryptor.encrypt(JSON.stringify(object), pass).toString();

                    return ciphertext;
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
        if (!Number.isInteger(pin) || pin < 0) {
            throw ERROR_MESSAGE.INCORRECT_PIN_TYPE
        }

        if(!encryptionKey || pin === undefined || pin === null) {
            return { error: ERROR_MESSAGE.ENTER_CREDS };
        }

        await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const accounts = await this.keyringInstance.getAccounts();

        const privData = await helper.generatePrivData(mnemonic, pin, this.encryptor);

        const label = helper.createWalletLabels();

        const rawVault = { eth: { public: [ { address: accounts[0], isDeleted: false, isImported: false, isExported: false, label } ], private: privData, numberOfAccounts: 1 } }

        const vault = await helper.cryptography(JSON.stringify(rawVault), JSON.stringify(encryptionKey), 'encryption', this.encryptor, this.isCustomEncryptor);

        this.vault = vault;

        this.logs.updateState({
            logs: [{ timestamp: Date.now(), action: 'vault-generation', vault: this.vault, platform: this.platform }],
        });

        return { response: vault };
    }

    async recoverVault(mnemonic, encryptionKey, pin, etherscanApiKey, polygonscanApiKey, bscscanApiKey, rpcUrl) {
        if (!Number.isInteger(pin) || pin < 0) {
            throw ERROR_MESSAGE.INCORRECT_PIN_TYPE
        }

        const vaultState = await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const accountsArray = await helper.removeEmptyAccounts(vaultState.keyrings[0].accounts[0], this.keyringInstance, vaultState, rpcUrl, etherscanApiKey, polygonscanApiKey, bscscanApiKey);

        const privData = await helper.generatePrivData(mnemonic, pin, this.encryptor);

        const numberOfAccounts = accountsArray.length;

        const rawVault = { eth: { public: accountsArray, private: privData, numberOfAccounts } }

        const vault = await helper.cryptography(JSON.stringify(rawVault), JSON.stringify(encryptionKey), 'encryption', this.encryptor, this.isCustomEncryptor);

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'vault-recovery', vault: this.vault, platform: this.platform });

        return { response: vault };
    }

    getSupportedChains() {
        const evmChains = Chains.evmChains;
        const nonEvmChains = Chains.nonEvmChains;

        return { response: { evmChains, nonEvmChains } };
    }
}

module.exports = Vault