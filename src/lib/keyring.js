const cryptojs = require('crypto-js');
const SafleId = require('@getsafle/safle-identity-wallet').SafleID;
const { ethers } = require("ethers");
const ObservableStore = require('obs-store');
const Web3 = require('web3');

const helper = require('../utils/helper');
const ERROR_MESSAGE = require('../constants/responses');
const Chains = require('../chains');

class Keyring {

    constructor() {
        this.logs = new ObservableStore({
            logs: [],
        });
    }

    async exportMnemonic(pin) {
        const mnemonicBytes = cryptojs.AES.decrypt(this.decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        const spaceCount = mnemonic.split(" ").length - 1;

        if(spaceCount !== 11) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        }

        return { response: mnemonic }
    }

    async validatePin(pin) {
        const mnemonicBytes = cryptojs.AES.decrypt(this.decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        const spaceCount = mnemonic.split(" ").length - 1;

        if(spaceCount !== 11) {
            return { response: false };
        }

        return { response: true };
    }

    async validateMnemonic(mnemonic, safleID) {
        const safle = new SafleId('mainnet');

        const { address } = await ethers.Wallet.fromMnemonic(mnemonic);

        const safleId = await safle.getSafleId(address);

        if (safleId === '' || safleId != safleID) {
            return { response: false };
        }

        return { response: true };
    }

    async getAccounts(encryptionKey) {
        const bytes = cryptojs.AES.decrypt(this.vault, JSON.stringify(encryptionKey));

        let decryptedVault;

        try {
            decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
            this.decryptedVault = decryptedVault;
        } catch(error) {
            return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY };
        }

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        let accounts = [];

        if (chain  === 'eth') {
            accounts.push(...decryptedVault.eth.public);

            const containsImported = (decryptedVault.importedWallets !== undefined && decryptedVault.importedWallets.evmChains !== undefined) ? true : false;

            if (containsImported) {
                accounts.push(...decryptedVault.importedWallets.evmChains.data);
            }

            return { response: accounts };
        }

        if (decryptedVault[this.chain] === undefined && decryptedVault.importedWallets === undefined) {
            return { error: ERROR_MESSAGE.NO_ACCOUNTS_FOUND };
        }

        (decryptedVault[this.chain] !== undefined) ? accounts.push(...decryptedVault[this.chain].public) : null;

        const containsImported = (decryptedVault.importedWallets !== undefined && decryptedVault.importedWallets[this.chain] !== undefined) ? true : false;

        if (containsImported) {
            accounts.push(...decryptedVault.importedWallets[this.chain].data);
        }

        return { response: accounts };
    }

    async exportPrivateKey(address, pin) {
        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        let isImportedAddress;

        if (chain === 'eth' && this.decryptedVault.importedWallets !== undefined && this.decryptedVault.importedWallets.evmChains !== undefined && this.decryptedVault.importedWallets.evmChains.data.some(element => element.address === address) == true) {
            isImportedAddress = true;
        } else if (this.decryptedVault.importedWallets !== undefined && this.decryptedVault.importedWallets[chain] !== undefined && this.decryptedVault.importedWallets[chain].data.some(element => element.address === address) == true) {
            isImportedAddress = true;
        } else {
            isImportedAddress = false;
        }

        if (!this.decryptedVault[chain] || (this.decryptedVault[chain].public.some(element => element.address === address) == false && isImportedAddress == false)) {
            return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
        }

        const { response } = await this.validatePin(pin)

        if (response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        if (isImportedAddress) {
            const privateKey = (chain === 'eth') ? this.decryptedVault.importedWallets.evmChains.data.find(element => element.address === address).privateKey : this.decryptedVault.importedWallets[chain].data.find(element => element.address === address).privateKey;

            const decryptedPrivKeyBytes = cryptojs.AES.decrypt(privateKey, pin);

            const decryptedPrivKey = decryptedPrivKeyBytes.toString(cryptojs.enc.Utf8);

            return { response: decryptedPrivKey };
        }

        if (chain === 'eth') {
            const privateKey = await this.keyringInstance.exportAccount(address)

            return { response: privateKey }
        }

        const { privateKey } = await this[chain].exportPrivateKey(address);

        return { response: privateKey };
    }

    async addAccount(encryptionKey, pin) {
        const { response } = await this.validatePin(pin)

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {
            const accounts = await this.keyringInstance.getAccounts();

            const keyring = await this.keyringInstance.getKeyringForAccount(accounts[0]);

            await this.keyringInstance.addNewAccount(keyring);

            const newAccount = await this.keyringInstance.getAccounts();

            this.decryptedVault.eth.public.push({ address: newAccount[newAccount.length - 1], isDeleted: false, isImported: false })
            this.decryptedVault.eth.numberOfAccounts++;

            const encryptedVault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

            this.vault = encryptedVault;

            this.logs.getState().logs.push({ timestamp: Date.now(), action: 'add-account', vault: this.vault, chain: this.chain, address: newAccount[newAccount.length - 1] });

            return { response: { vault: encryptedVault, address: newAccount[newAccount.length - 1] }};
        }

        const { response: mnemonic } = await this.exportMnemonic(pin);

        let newAddress;

        if (this[this.chain] === undefined) {
            const keyringInstance = await helper.getCoinInstance(this.chain, mnemonic);

            this[this.chain] = keyringInstance;

            const { address } = await this[this.chain].addAccount();

            newAddress = address;

            const publicData = [ { address, isDeleted: false, isImported: false } ];
            this.decryptedVault[this.chain] = { public: publicData, numberOfAccounts: 1 };
        } else {
            const { address } = await this[this.chain].addAccount();

            newAddress = address;

            (this.decryptedVault[this.chain] === undefined) ? this.decryptedVault[this.chain] = { public: [ { address: newAddress, isDeleted: false, isImported: false } ], numberOfAccounts: 1 } : this.decryptedVault[this.chain].public.push({ address: newAddress, isDeleted: false, isImported: false });
            this.decryptedVault[this.chain].numberOfAccounts++;
        }

        const encryptedVault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

        this.vault = encryptedVault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'add-account', vault: this.vault, chain: this.chain, address: newAddress });

        return { response: { vault: encryptedVault, address: newAddress }};
    }

    async signMessage(address, data, pin) {
        const { response } = await this.validatePin(pin)

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {
            const accounts = await this.keyringInstance.getAccounts();

            if (accounts.includes(address) === false) {
                return { error: ERROR_MESSAGE.NONEXISTENT_KEYRING_ACCOUNT };
            }

            const msg = await helper.stringToArrayBuffer(data);

            const msgParams = { from: address, data: msg };

            const signedMsg = await this.keyringInstance.signMessage(msgParams);

            return { response: signedMsg };
        }

        const accounts = await this[this.chain].getAccounts();

        if (accounts.includes(address) === false) {
            return { error: ERROR_MESSAGE.NONEXISTENT_KEYRING_ACCOUNT };
        }

        const msgParams = { from: address, data: msg };

        const { signedMessage } = await this[this.chain].signMessage(msgParams, address);

        return { response: signedMessage };
    }

    async signTransaction(rawTx, pin, rpcUrl) {
        const { response } = await this.validatePin(pin)

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };
 
        if (this.chain === 'ethereum') {
            const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            const signedTx = await this.keyringInstance.signTransaction(rawTx, web3);

            return { response: signedTx };
        }

        const { error, response: privateKey } = await this.exportPrivateKey(rawTx.from, pin);

        if (error) {
            return { error };
        }

        if (Chains.evmChains.hasOwnProperty(this.chain)) {
            const keyringInstance = await helper.getCoinInstance(this.chain);

            const signedTx = await keyringInstance.signTransaction(rawTx, privateKey);

            return { response: signedTx };
        }

        const { signedTransaction } = await this[this.chain].signTransaction(rawTx, privateKey);

        return { response: signedTransaction };
    }

    async restoreKeyringState(vault, pin, encryptionKey) {
        const bytes = cryptojs.AES.decrypt(vault, JSON.stringify(encryptionKey));

        let decryptedVault;

        try {
            decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
            this.decryptedVault = decryptedVault;
        } catch(error) {
            return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY };
        }

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'restore-keyring', vault: this.vault });

        const mnemonicBytes = cryptojs.AES.decrypt(decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        const restoredVault = await this.keyringInstance.createNewVaultAndRestore(JSON.stringify(encryptionKey), mnemonic);

        const numberOfAcc = this.decryptedVault.eth.numberOfAccounts;

        let decryptedkeyring = await this.keyringInstance.getKeyringsByType(restoredVault.keyrings[0].type);

        if(numberOfAcc > 1) {
            for(let i=0; i < numberOfAcc-1; i++) {
            await this.keyringInstance.addNewAccount(decryptedkeyring[0]);

            decryptedkeyring[0].opts.numberOfAccounts = numberOfAcc;
            }
        } else {
            decryptedkeyring[0].opts.numberOfAccounts = numberOfAcc;
        }
    }

    async deleteAccount(encryptionKey, address, pin) {
        const { response } = await this.validatePin(pin);

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        if (this.decryptedVault[chain].public.some(element => element.address === address) == false) {
            return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
        }

        const objIndex = this.decryptedVault[chain].public.findIndex((obj => obj.address === address));

        this.decryptedVault[chain].public[objIndex].isDeleted = true;
        this.decryptedVault[chain].numberOfAccounts--;

        const vault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'delete-account', vault: this.vault, chain: this.chain });

        return { response: vault };
    }

    async importWallet(privateKey, pin, encryptionKey) {
        const { response } = await this.validatePin(pin);

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const encryptedPrivKey = cryptojs.AES.encrypt(privateKey, pin).toString();

        let address;

        if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {
            address = await this.keyringInstance.importWallet(privateKey);

            if(this.decryptedVault.importedWallets === undefined) {    
                this.decryptedVault.importedWallets = { evmChains: { data: [{ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true }] } };
            } else if (this.decryptedVault.importedWallets.evmChains === undefined) {
                this.decryptedVault.importedWallets.evmChains = { data: [{ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true }] };
            } else {
                this.decryptedVault.importedWallets.evmChains.data.push({ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true });
            }
        } else {
            const { response: mnemonic } = await this.exportMnemonic(pin);

            if (this[this.chain] === undefined) {
                const keyringInstance = await helper.getCoinInstance(this.chain, mnemonic);

                this[this.chain] = keyringInstance;

                address = await keyringInstance.importWallet(privateKey);
            } else {
                address = await this[this.chain].importWallet(privateKey);
            }

            if (this.decryptedVault.importedWallets === undefined) {
                let object = {};

                const data = [ { address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey } ];

                object[this.chain] = { data };
                this.decryptedVault.importedWallets = object;
            } else if (this.decryptedVault.importedWallets[this.chain] === undefined) {        
                const data = [ { address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey } ];

                this.decryptedVault.importedWallets[this.chain] = { data };
            } else {
                this.decryptedVault.importedWallets[this.chain].data.push({ address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey });
            }
        }

        const vault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'import-wallet', vault: this.vault, chain: this.chain, address });

        return { response: { vault, address } };
    }

    async getActiveChains() {
        let importedChains = [];
        let generatedChains = [];

        (this.decryptedVault.importedWallets !== undefined) ? importedChains.push(...Object.keys(this.decryptedVault.importedWallets)) : null;

        generatedChains.push(...Object.keys(this.decryptedVault));

        generatedChains.push(...Object.keys(Chains.evmChains));

        (generatedChains.includes('importedWallets')) ? generatedChains.splice(generatedChains.indexOf('importedWallets'), 1) : null;
        
        (generatedChains.includes('eth')) ? generatedChains.splice(generatedChains.indexOf('eth'), 1) : null;

        (importedChains.includes('evmChains')) ? importedChains.splice(importedChains.indexOf('evmChains'), 1) : null;

        const array = importedChains.concat(generatedChains);

        const result = array.filter((item, pos) => array.indexOf(item) === pos);

        let chains = [];
        
        result.map(chain => {
            if(Chains.evmChains.hasOwnProperty(chain)) {
                chains.push({
                    chain: chain,
                    symbol: Chains.evmChains[chain],
                });
            } else {
                chains.push({
                    chain: chain,
                    symbol: Chains.nonEvmChains[chain],
                });
            }
        });

        return { response: chains };
    }

    async getVaultDetails(encryptionKey, EthRpcUrl, polygonRpcUrl) {
        const bytes = cryptojs.AES.decrypt(this.vault, JSON.stringify(encryptionKey));

        let decryptedVault;

        try {
            decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
            this.decryptedVault = decryptedVault;
        } catch(error) {
            return { error: ERROR_MESSAGE.INCORRECT_ENCRYPTION_KEY };
        }

        let accounts = { evm: { } };

        const activeChains = await this.getActiveChains();

        const valuesToRemove = Object.keys(Chains.evmChains);

        let assetsDetails;

        assetsDetails = await helper.getAssetDetails(decryptedVault.eth.public, EthRpcUrl, polygonRpcUrl);

        accounts.evm.generatedWallets = ({ ...assetsDetails })

        const containsImported = (decryptedVault.importedWallets !== undefined && decryptedVault.importedWallets.evmChains !== undefined) ? true : false;

        if (containsImported) {
            assetsDetails = await helper.getAssetDetails(decryptedVault.importedWallets.evmChains.data, EthRpcUrl, polygonRpcUrl);

            accounts.evm.importedWallets = ({ ...assetsDetails });
        }

        const filteredChains = activeChains.response.filter(activeChains => !valuesToRemove.includes(activeChains.chain));

        let nonEvmAccs = [];

        filteredChains.forEach(async ({ chain }) => {
            const containsGenerated = (decryptedVault[chain] !== undefined) ? true : false;
            const containsImported = (decryptedVault.importedWallets !== undefined && decryptedVault.importedWallets[chain] !== undefined) ? true : false;

            if (containsGenerated) {
                nonEvmAccs = decryptedVault[chain].public.filter((address) => address.isDeleted === false);

                let result = nonEvmAccs.map(a => a.address);

                accounts[chain] = { generatedWallets: [ ...result ] };
            }
            
            if (containsImported) {
                nonEvmAccs = decryptedVault.importedWallets[chain].data.filter((address) => address.isDeleted === false);

                let result = nonEvmAccs.map(a => a.address);

                (accounts[chain] === undefined) ? accounts[chain] = { importedWallets: [ ...result ] } : accounts[chain].importedWallets = [ ...result ];
            }
        });

        return { response: accounts };
    }

    async getBalance(address, rpcUrl) {
        if (Chains.evmChains.hasOwnProperty(this.chain)) {
            const accounts = await this.keyringInstance.getAccounts();

            if (accounts.includes(address) === false) {
                return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
            }

            const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            const balance = await Chains[this.chain].getBalance(address, web3);

            return { response: balance };
        }

        const accounts = await this[this.chain].getAccounts();

        if (accounts.includes(address) === false) {
            return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
        }

        const balance = await Chains[this.chain].getBalance(address);

        return { response: balance };   
    }

    async sign(data, address, pin, rpcUrl) {
        const { response } = await this.validatePin(pin)

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error, response: privateKey } = await this.exportPrivateKey(address, pin);

        if (error) {
            return { error };
        }

        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

        if (this.chain === 'ethereum') {

            const signedData = await this.keyringInstance.sign(data, privateKey, web3);

            return { response: signedData };
        }

        if (Chains.evmChains.hasOwnProperty(this.chain)) {
            const keyringInstance = await helper.getCoinInstance(this.chain);

            const signedData = await keyringInstance.sign(data, privateKey, web3);

            return { response: signedData };
        }

        return { error: ERROR_MESSAGE.UNSUPPORTED_NON_EVM_FUNCTIONALITY }
    }

    getLogs() {
        return this.logs.getState();
    }

}

module.exports = Keyring;