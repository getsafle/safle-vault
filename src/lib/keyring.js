const SafleId = require('@getsafle/safle-identity-wallet').SafleID;
const { ethers } = require("ethers");
const ObservableStore = require('obs-store');
const Web3 = require('web3');
const _ = require('lodash');

const { RateLimiter } = require("limiter");
const helper = require('../utils/helper');
const ERROR_MESSAGE = require('../constants/responses');
const Chains = require('../chains');
const Config = require('../config')
const Constants = require('../constants/index')

const limiter = new RateLimiter({
    tokensPerInterval: Config.TOKEN_COUNT,
    interval: Config.TOKEN_WINDOW,
    fireImmediately: true
  });

class Keyring {

    constructor() {
        this.logs = new ObservableStore({
            logs: [],
        });
        this.timeout = 0;
    }

    async exportMnemonic(pin) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const response = await this.validatePin(pin);

        if (response.response == false || response.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        }

        const mnemonic = await helper.cryptography(this.decryptedVault.eth.private.encryptedMnemonic, pin, 'decryption');

        const spaceCount = mnemonic.split(" ").length - 1;

        if(spaceCount !== 11) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        }

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'export-mnemonic', vault: this.vault, chain: this.chain });

        return { response: mnemonic }
    }

    async validatePin(pin) {
        let trace=new Error().stack.split('\n')
        trace=trace[trace.length-1].toString().split('/')

        if(this.timeout>Date.now() && !trace.includes(Constants.CONSTANT_ONE,Constants.CONSTANT_TWO,Constants.CONSTANT_THREE)){
            return{ error: `${ERROR_MESSAGE.REQUEST_BLOCKED} for ${((this.timeout-Date.now())/60000).toFixed(0)} minutes`  }
        }
        let remainingRequests
        if(!trace.includes('node_modules','jest-runner','build')){
            remainingRequests =  await limiter.removeTokens(1);

        }

        if (remainingRequests <= 0 && !trace.includes('node_modules','jest-runner','build')) {
             this.timeout = Date.now() + Config.REQUEST_BLOCKED_TIMEOUT;
            return { error: ERROR_MESSAGE.REQUEST_LIMIT_EXCEEDED };
        } else {
            if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
                return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
            }
    
            let spaceCount;
    
            try {
                const mnemonic = await helper.cryptography(this.decryptedVault.eth.private.encryptedMnemonic, pin, 'decryption');
        
                spaceCount = mnemonic.split(" ").length - 1;
            } catch (error) {
                return { response: false };
            }
    
            if(spaceCount !== 11) {
                return { response: false };
            }
    
            return { response: true };
        }
    }


    async validateMnemonic(mnemonic, safleID, network, polygonRpcUrl) {
        if (network !== 'mainnet' && network !== 'testnet') {
            throw ERROR_MESSAGE.INVALID_NETWORK;
        }

        const safle = new SafleId(network, polygonRpcUrl);

        let address;

        try {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            
            address = wallet.address;
        } catch (e) {
            return { response: false };
        }

        const safleId = await safle.getSafleId(address);

        if (safleId === '' || safleId != safleID) {
            return { response: false };
        }

        return { response: true };
    }

    async getAccounts() {

        const decryptedVault = this.decryptedVault;

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        let accounts = [];

        if (chain  === 'eth') {
            accounts.push(...decryptedVault.eth.public);

            const containsImported = (_.get(decryptedVault, 'importedWallets.evmChains') !== undefined) ? true : false;

            if (containsImported) {
                accounts.push(...decryptedVault.importedWallets.evmChains.data);
            }

            return { response: accounts };
        }

        if (decryptedVault[this.chain] === undefined && _.get(decryptedVault, `importedWallets.${this.chain}`) === undefined) {
            return { error: ERROR_MESSAGE.NO_ACCOUNTS_FOUND };
        }

        (decryptedVault[this.chain] !== undefined) ? accounts.push(...decryptedVault[this.chain].public) : null;

        const containsImported = (_.get(decryptedVault, `importedWallets.${this.chain}`) !== undefined) ? true : false;

        if (containsImported) {
            accounts.push(...decryptedVault.importedWallets[this.chain].data);
        }

        return { response: accounts };
    }

    async exportPrivateKey(address, pin) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const response = await this.validatePin(pin);

        if (response.response == false || response.error)  {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;
        const importedChain = (chain === 'eth') ? 'evmChains' : chain;

        let isImportedAddress;

        if (_.get(this.decryptedVault, `importedWallets.${importedChain}`) !== undefined && this.decryptedVault.importedWallets[importedChain].data.some(element => element.address === address) == true) {
            isImportedAddress = true;
        } else if (this.decryptedVault[chain] !== undefined && this.decryptedVault[chain].public.some(element => element.address.toLowerCase() === address.toLowerCase()) == true) {
            isImportedAddress = false;
        } else {
            return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
        }

        if (isImportedAddress) {
            const privateKey = (chain === 'eth') ? this.decryptedVault.importedWallets.evmChains.data.find(element => element.address === address).privateKey : this.decryptedVault.importedWallets[chain].data.find(element => element.address === address).privateKey;

            let decryptedPrivKey = await helper.cryptography(privateKey, pin, 'decryption');

            if (decryptedPrivKey.startsWith('0x')) {
                decryptedPrivKey = decryptedPrivKey.slice(2)
            }

            this.logs.getState().logs.push({ timestamp: Date.now(), action: 'export-private-key', vault: this.vault, chain: this.chain, address: address, isImportedAddress: isImportedAddress });
            return { response: { privateKey: decryptedPrivKey, isImported : isImportedAddress}}
        }

        if (chain === 'eth') {
            const privateKey = await this.keyringInstance.exportAccount(address)

            this.logs.getState().logs.push({ timestamp: Date.now(), action: 'export-private-key', vault: this.vault, chain: this.chain, address: address, isImportedAddress: isImportedAddress });
            return { response: {privateKey, isImported : isImportedAddress}  }
        }

        const { privateKey } = await this[chain].exportPrivateKey(address);

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'export-private-key', vault: this.vault, chain: this.chain, address: address, isImportedAddress: isImportedAddress });
        return { response: {privateKey, isImported : isImportedAddress}  };
    }

    async addAccount(encryptionKey, pin) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const response = await this.validatePin(pin)

        if(response.response == false || response.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (error) {
            return { error }
        }

        const acc = await this.getAccounts();

        if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {
            const accounts = await this.keyringInstance.getAccounts();

            const keyring = await this.keyringInstance.getKeyringForAccount(accounts[0]);

            await this.keyringInstance.addNewAccount(keyring);

            const newAccount = await this.keyringInstance.getAccounts();

            this.decryptedVault.eth.public.push({ address: newAccount[newAccount.length - 1], isDeleted: false, isImported: false, label: `Wallet ${acc.response.length + 1}` })
            this.decryptedVault.eth.numberOfAccounts++;

            const encryptedVault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

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

            const publicData = [ { address, isDeleted: false, isImported: false, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${acc.response ? acc.response.length + 1 : 1}` } ];
            this.decryptedVault[this.chain] = { public: publicData, numberOfAccounts: 1 };
        } else {
            const { address } = await this[this.chain].addAccount();

            newAddress = address;

            (this.decryptedVault[this.chain] === undefined) ? this.decryptedVault[this.chain] = { public: [ { address: newAddress, isDeleted: false, isImported: false, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${acc.response.length + 1}` } ], numberOfAccounts: 1 } : this.decryptedVault[this.chain].public.push({ address: newAddress, isDeleted: false, isImported: false, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${acc.response.length + 1}` });
            this.decryptedVault[this.chain].numberOfAccounts++;
        }

        const encryptedVault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

        this.vault = encryptedVault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'add-account', vault: this.vault, chain: this.chain, address: newAddress });

        return { response: { vault: encryptedVault, address: newAddress }};
    }

    async signMessage(address, data, pin, encryptionKey, rpcUrl = '') {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const res = await this.validatePin(pin)

        if(res.response == false || res.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const err = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (err.error) {
            return { error : err.error }
        }

        const { error, response } = await this.exportPrivateKey(address, pin);

        if (error) {
            return { error };
        }
        
        const {privateKey, isImported} = response
        

        if (isImported) {
            const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            if (this.chain === 'ethereum') {

                const signedMessage = await this.keyringInstance.sign(data, privateKey, web3);

                return { response: signedMessage.message };
            }

            if (Chains.evmChains.hasOwnProperty(this.chain)) {
                const keyringInstance = await helper.getCoinInstance(this.chain);

                const signedMessage = await keyringInstance.sign(data, privateKey, web3);

                return { response: signedMessage.message };
            }

            if (Chains?.[this.chain]){
                    const { signedMessage } = await this[this.chain].signMessage(data, address, privateKey);
                    return { response: signedMessage };
                
            }

            return { error: ERROR_MESSAGE.UNSUPPORTED_NON_EVM_FUNCTIONALITY }
            
        }
        else{
            const accounts = await this.getAccounts();

            if(accounts.response.filter(e => e.address === address).length < 1) {
                return { error: ERROR_MESSAGE.NONEXISTENT_KEYRING_ACCOUNT };
            }

            if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {

                const msgParams = { from: address, data: data };

                const signedMsg = await this.keyringInstance.signMessage(msgParams);

                return { response: signedMsg };
            }

            const { signedMessage } = await this[this.chain].signMessage(data, address);

            return { response: signedMessage };
        }
        
    }

    async signTransaction(rawTx, pin, rpcUrl) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const res = await this.validatePin(pin)

        if(res.response == false || res.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };
 
        const { error, response } = await this.exportPrivateKey(rawTx.from, pin);

        if (error) {
            return { error };
        }
        
        const {privateKey, isImported} = response
 
        if (this.chain === 'ethereum') {
            const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
            if(isImported) {
                const signedTransaction = await this.keyringInstance.signTransaction(rawTx, web3, privateKey);
                return { response: signedTransaction };
            }
            else {
                const signedTx = await this.keyringInstance.signTransaction(rawTx, web3);
                return { response: signedTx };
            }
        }
        
        if (Chains.evmChains.hasOwnProperty(this.chain)) {
            const keyringInstance = await helper.getCoinInstance(this.chain);

            const signedTx = await keyringInstance.signTransaction(rawTx, privateKey);

            return { response: signedTx };
        }

        if(isImported) {
            const { signedTransaction } = await this[this.chain].signTransaction(rawTx, privateKey);
            return { response: signedTransaction };
        }
        else{
            const { signedTransaction } = await this[this.chain].signTransaction(rawTx);
            return { response: signedTransaction };
        }
        

        return { response: signedTransaction };
    }

    async restoreKeyringState(vault, pin, encryptionKey) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const res = await this.validatePin(pin)

        if(res.response == false || res.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { decryptedVault, error } = helper.validateEncryptionKey(vault, JSON.stringify(encryptionKey));

        if (error) {
            return { error }
        }

        this.decryptedVault = decryptedVault;

        this.vault = vault;

        const activeChains = await this.getActiveChains();

        const evmChainList = Object.keys(Chains.evmChains);

        const filteredChains = activeChains.response.filter(activeChains => !evmChainList.includes(activeChains.chain));

        const mnemonic = await helper.cryptography(decryptedVault.eth.private.encryptedMnemonic, pin, 'decryption');

        //generate other chain's keyring instance and add accounts to it as per decrypted vault
        if (filteredChains.length > 0) {
            filteredChains.forEach(async (chainData) => {
                

                const keyringInstance = await helper.getCoinInstance(chainData.chain.toLowerCase(), mnemonic);

                this[chainData.chain.toLowerCase()] = keyringInstance;

                const numberOfAcc = this.decryptedVault[chainData.chain.toLowerCase()].numberOfAccounts;


                for (let i = 0; i < numberOfAcc; i++) {
                    await this[chainData.chain].addAccount();
                }
            })
        }

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'restore-keyring', vault: this.vault });

        // clearing vault state and adding new accounts as per decrypted vault
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
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const response = await this.validatePin(pin);

        if(response.response == false || response.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (error) {
            return { error }
        }

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        const importedChain = (chain === 'eth') ? 'evmChains' : chain;

        let objIndex;

        if (_.get(this.decryptedVault, `importedWallets.${importedChain}`) !== undefined && this.decryptedVault.importedWallets[importedChain].data.some(element => element.address === address) == true) {

            objIndex = this.decryptedVault.importedWallets[importedChain].data.findIndex((obj => 
                obj.address === address
            ));

            this.decryptedVault.importedWallets[importedChain].data[objIndex].isDeleted = true;
        } else {

            objIndex = this.decryptedVault[chain].public.findIndex((obj => 
                obj.address === address
            ));

            if(objIndex < 0) {
                return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
            }

            this.decryptedVault[chain].public[objIndex].isDeleted = true;
        }

        const vault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'delete-account', vault: this.vault, chain: this.chain, address: address });

        return { response: vault };
    }

    async restoreAccount(encryptionKey, address, pin) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const { response } = await this.validatePin(pin);

        if(response == false) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (error) {
            return { error }
        }

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        const importedChain = (chain === 'eth') ? 'evmChains' : chain;

        let objIndex;

        if (_.get(this.decryptedVault, `importedWallets.${importedChain}`) !== undefined && this.decryptedVault.importedWallets[importedChain].data.some(element => element.address === address) == true) {

            objIndex = this.decryptedVault.importedWallets[importedChain].data.findIndex((obj => 
                obj.address === address
            ));

            this.decryptedVault.importedWallets[importedChain].data[objIndex].isDeleted = false;
        } else {

            objIndex = this.decryptedVault[chain].public.findIndex((obj => 
                obj.address === address
            ));

            if(objIndex < 0) {
                return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
            }

            this.decryptedVault[chain].public[objIndex].isDeleted = false;
        }

        const vault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption', this.encryptor, this.isCustomEncryptor);

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'restore-account', vault: this.vault, chain: this.chain, address, platform: this.platform });

        return { response: vault };
    }

    async importWallet(privateKey, pin, encryptionKey) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const response = await this.validatePin(pin);

        if(response.response == false || response.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));

        if (error) {
            return { error }
        }

        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.slice(2)
        }

        const encryptedPrivKey = await helper.cryptography(privateKey, pin, 'encryption');

        let address;
        let accounts;
        let isDuplicateAddress;
        let numOfAcc;

        accounts = await this.getAccounts();

        if (accounts.error) {
            numOfAcc = 0;
        }

        if (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') {
            
            const keyringInstance = await helper.getCoinInstance(this.chain);

            address = await keyringInstance.importWallet(privateKey);

            if (!accounts.error) {
                numOfAcc = accounts.response.length;

                accounts.response.forEach(element => { 
                    if (element.address === address) {
                        isDuplicateAddress = true;
                    }
                });

                if (isDuplicateAddress) {
                    return { error: ERROR_MESSAGE.ADDRESS_ALREADY_PRESENT };
                }
            }

            if (this.decryptedVault.importedWallets === undefined) {
                this.decryptedVault.importedWallets = { evmChains: { data: [{ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true, label: `Wallet ${numOfAcc + 1}` }] } };
            } else if (this.decryptedVault.importedWallets.evmChains === undefined) {
                this.decryptedVault.importedWallets.evmChains = { data: [{ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true, label: `Wallet ${numOfAcc + 1}` }] };
            } else {
                this.decryptedVault.importedWallets.evmChains.data.push({ address, privateKey: encryptedPrivKey, isDeleted: false, isImported: true, label: `Wallet ${numOfAcc + 1}` });
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

            if (!accounts.error) {
                accounts.response.forEach(element => { 
                    numOfAcc = accounts.response.length;

                    if (element.address === address) {
                        isDuplicateAddress = true;
                    }
                });
    
                if (isDuplicateAddress) {
                    return { error: ERROR_MESSAGE.ADDRESS_ALREADY_PRESENT };
                }
            }

            if (this.decryptedVault.importedWallets === undefined) {
                let object = {};

                const data = [ { address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${numOfAcc + 1}` } ];

                object[this.chain] = { data };
                this.decryptedVault.importedWallets = object;
            } else if (this.decryptedVault.importedWallets[this.chain] === undefined) {        
                const data = [ { address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${numOfAcc + 1}` } ];

                this.decryptedVault.importedWallets[this.chain] = { data };
            } else {
                this.decryptedVault.importedWallets[this.chain].data.push({ address, isDeleted: false, isImported: true, privateKey: encryptedPrivKey, label: `${this.chain[0].toUpperCase() + this.chain.slice(1)} Wallet ${numOfAcc + 1}` });
            }
        }

        const vault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

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

    async getVaultDetails(encryptionKey) {

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (error) {
            return { error }
        }

        const decryptedVault = this.decryptedVault;

        let accounts = { evm: { } };

        const activeChains = await this.getActiveChains();

        const evmChainList = Object.keys(Chains.evmChains);

        accounts.evm.generatedWallets = ({ ...decryptedVault.eth.public })

        const containsImported = (_.get(decryptedVault, 'importedWallets.evmChains') !== undefined) ? true : false;

        if (containsImported) {
            accounts.evm.importedWallets = ({ ...decryptedVault.importedWallets.evmChains.data });
        }

        const filteredChains = activeChains.response.filter(activeChains => !evmChainList.includes(activeChains.chain));

        let nonEvmAccs = [];

        filteredChains.forEach(async ({ chain }) => {
            const containsGenerated = (decryptedVault[chain] !== undefined) ? true : false;
            const containsImported = (_.get(decryptedVault, `importedWallets.${chain}`) !== undefined) ? true : false;

            if (containsGenerated) {
                nonEvmAccs = decryptedVault[chain].public.filter((address) => address.isDeleted === false);
                accounts[chain] = { generatedWallets: { ...decryptedVault[chain].public } };
            }
            
            if (containsImported) {
                nonEvmAccs = decryptedVault.importedWallets[chain].data.filter((address) => address.isDeleted === false);
               (accounts[chain] === undefined) ? accounts[chain] = { importedWallets: { ...decryptedVault.importedWallets[chain].data } } : accounts[chain].importedWallets = { ...decryptedVault.importedWallets[chain].data };
            }
        });

        return { response: accounts };
    }

    async getAssets({ addresses, chains, EthRpcUrl, polygonRpcUrl, bscRpcUrl }) {
        if (!Array.isArray(addresses) && !Array.isArray(chains)) {
            throw ERROR_MESSAGE.SHOULD_BE_AN_ARRAY;
        }

        const assetsDetails = await helper.getAssetDetails({ addresses, chains, EthRpcUrl, polygonRpcUrl, bscRpcUrl });

        return { response: assetsDetails };
    }

    async getBalance(address, rpcUrl) {
        if (Chains.evmChains.hasOwnProperty(this.chain)) {
            const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            const balance = await Chains[this.chain].getBalance(address, web3);

            return { response: balance };
        }

        const balance = await Chains[this.chain].getBalance(address);

        return { response: balance }; 
    }

    async sign(data, address, pin, rpcUrl) {
        if (typeof(pin) != 'string'|| pin.match(/^[0-9]+$/) === null || pin < 0 || pin.length !=6 ) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
        }

        const res = await this.validatePin(pin)

        if(res.response == false || res.error) {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const { error, response } = await this.exportPrivateKey(address, pin);

        if (error) {
            return { error };
        }
        
        const {privateKey, isImported} = response

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

    async updateLabel(address, encryptionKey, newLabel, chainName) {

        const { error } = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (error) {
            return { error }
        }

        if (newLabel === null || newLabel === undefined) {
            return { error: ERROR_MESSAGE.INCORRECT_LABEL_TYPE };
        }

        let chain = (Chains.evmChains.hasOwnProperty(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        const importedChain = (chain === 'eth') ? 'evmChains' : chain;

        let objIndex;

        if (_.get(this.decryptedVault, `importedWallets.${importedChain}`) !== undefined && this.decryptedVault.importedWallets[importedChain].data.some(element => element.address === address) == true) {

            objIndex = this.decryptedVault.importedWallets[importedChain].data.findIndex((obj => 
                obj.address === address
            ));

            this.decryptedVault.importedWallets[importedChain].data[objIndex].label = newLabel;
        } else {

            objIndex = this.decryptedVault[chain].public.findIndex((obj => 
                obj.address === address
            ));

            if(objIndex < 0) {
                return { error: ERROR_MESSAGE.ADDRESS_NOT_PRESENT };
            }
            if (typeof this.decryptedVault[chain].public[objIndex].label === 'string' || this.decryptedVault[chain].public[objIndex].label instanceof String){
                if(chain === 'eth') {
                    const chains = Object.keys(Chains.evmChains);
                    let obj = chains.reduce(function(acc, curr) {
                        acc[curr] = newLabel;
                        return acc;
                    }, {});
                  this.decryptedVault[chain].public[objIndex].label = obj;
                }
                else {
                    this.decryptedVault[chain].public[objIndex].label = newLabel;
                }             
            }
            else{
            (chain === 'eth') ? this.decryptedVault[chain].public[objIndex].label[chainName] = newLabel : this.decryptedVault[chain].public[objIndex].label = newLabel;
        }
    }

        const vault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'update-label', vault: this.vault, chain: this.chain, address: address });

        return { response: vault };
    }

    async resetAllImportedWallets(currentPin, newPin) {

        if (_.get(this.decryptedVault, `importedWallets`) === undefined) {
            return null;
        } 

        let importedChains  = Object.keys(this.decryptedVault.importedWallets)
        
        for (let importedChain of importedChains)
        {
            let data = this.decryptedVault.importedWallets[importedChain].data
            for(let i = 0; i < data.length; i++) {
                let decryptedPrivKey = await helper.cryptography(data[i].privateKey, currentPin, 'decryption');
                let encryptedPrivKey = await helper.cryptography(decryptedPrivKey, newPin, 'encryption');
                this.decryptedVault.importedWallets[importedChain].data[i].privateKey = encryptedPrivKey

            }
        }
        
}


    async changePin(currentPin, newPin, encryptionKey) {
        
        if (typeof(currentPin) != 'string' || currentPin < 0) {
            throw ERROR_MESSAGE.INCORRECT_PIN_TYPE
        }

        if (typeof(newPin) != 'string' || newPin < 0) {
            throw ERROR_MESSAGE.INCORRECT_PIN_TYPE
        }

        const response = await this.validatePin(currentPin);

        if (response.response == false || response.error)  {
            return { error: ERROR_MESSAGE.INCORRECT_PIN };
        };

        const err = helper.validateEncryptionKey(this.vault, JSON.stringify(encryptionKey));
        
        if (err.error) {
            return { error : err.error }
        }    

        const { error, response: mnemonic }= await this.exportMnemonic(currentPin);

        if (error) {
            return { error: ERROR_MESSAGE.INCORRECT_CURRENT_PIN };
        };

        const privData = await helper.generatePrivData(mnemonic, newPin);

        this.decryptedVault.eth.private = privData;

        await this.resetAllImportedWallets(currentPin, newPin);

        const vault = await helper.cryptography(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey), 'encryption');

        this.vault = vault;

        this.logs.getState().logs.push({ timestamp: Date.now(), action: 'change-pin', vault: this.vault });

        return { response: vault };
    }

    getLogs() {
        return this.logs.getState();
    }

}

module.exports = Keyring;