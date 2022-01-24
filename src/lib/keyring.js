const cryptojs = require('crypto-js');
const SafleId = require('@getsafle/safle-identity-wallet').SafleID;
const { ethers } = require("ethers");

const helper = require('../utils/helper');
const errorMessage = require('../constants/responses');
const Chains = require('../chains');

class Keyring {

    async exportMnemonic(pin) {
        const mnemonicBytes = cryptojs.AES.decrypt(this.decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        if(mnemonic == '') {
            return { error: errorMessage.INCORRECT_PIN };
        }
    
        return { response: mnemonic }
    }

    async validatePin(pin) {
        const mnemonicBytes = cryptojs.AES.decrypt(this.decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        if(mnemonic == '') {
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
            return { error: errorMessage.INCORRECT_ENCRYPTION_KEY };
        }

        let chain = (Chains.evmChains.includes(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        if (chain  === 'eth') {
            const accounts = decryptedVault.eth.public;
        
            return { response: accounts }
        }

        const accounts = decryptedVault[this.chain].public;

        return { response: accounts };

    }

    async exportPrivateKey(address, pin) {
        let chain = (Chains.evmChains.includes(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        if (this.decryptedVault[chain].public.some(element => element.address === address) == false) {
            return { error: errorMessage.ADDRESS_NOT_PRESENT };
        }

        const { response } = await this.validatePin(pin)

        if (response == false) {
            return { error: errorMessage.INCORRECT_PIN };
        };

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
            return { error: errorMessage.INCORRECT_PIN };
        };

        if (Chains.evmChains.includes(this.chain) || this.chain === 'ethereum') {
            const accounts = await this.keyringInstance.getAccounts();

            const keyring = await this.keyringInstance.getKeyringForAccount(accounts[0]);

            await this.keyringInstance.addNewAccount(keyring);

            const newAccount = await this.keyringInstance.getAccounts();

            this.decryptedVault.eth.public.push({ address: newAccount[newAccount.length - 1], isDeleted: false })
            this.decryptedVault.eth.numberOfAccounts++;

            const encryptedVault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

            this.vault = encryptedVault;

            return { response: encryptedVault };
        }

        const { response: mnemonic } = await this.exportMnemonic(pin);

        let keyringInstance;

        if (this[this.chain] === undefined) {
            keyringInstance = await helper.getCoinInstance(this.chain, mnemonic);
    
            this[this.chain] = keyringInstance;

            const { address } = await this[this.chain].addAccount();
    
            const publicData = [ { address, isDeleted: false } ];
            this.decryptedVault[this.chain] = { public: publicData, numberOfAccounts: 1 };
        } else {
            const { address } = await this[this.chain].addAccount();
    
            this.decryptedVault[this.chain].public.push({ address, isDeleted: false });
            this.decryptedVault[this.chain].numberOfAccounts++;
        }

        const encryptedVault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();
        
        this.vault = encryptedVault;
    
        return { response: encryptedVault };
    }

    async signMessage(address, data, pin) {
        const { response } = await this.validatePin(pin)

        if(response == false) {
            return { error: errorMessage.INCORRECT_PIN };
        };

        if (Chains.evmChains.includes(this.chain) || this.chain === 'ethereum') {
            const accounts = await this.keyringInstance.getAccounts();
            
            if (accounts.includes(address) === false) {
                return { error: errorMessage.NONEXISTENT_KEYRING_ACCOUNT };
            }
    
            const msg = await helper.stringToArrayBuffer(data);
    
            const msgParams = { from: address, data: msg };
    
            const signedMsg = await this.keyringInstance.signMessage(msgParams);
    
            return { response: signedMsg };
        }

        const accounts = await this[this.chain].getAccounts();
            
        if (accounts.includes(address) === false) {
            return { error: errorMessage.NONEXISTENT_KEYRING_ACCOUNT };
        }

        const msgParams = { from: address, data: msg };

        const { signedMessage } = await this[this.chain].signMessage(msgParams, address);

        return { response: signedMessage };
    }

    async signTransaction(rawTx, pin) {
        const { response } = await this.validatePin(pin)
        
        if(response == false) {
            return { error: errorMessage.INCORRECT_PIN };
        };
 
        if (this.chain === 'ethereum') {
            const signedTx = await this.keyringInstance.signTransaction(rawTx, this.web3);

            return { response: signedTx };
        }

        const { error, response: privateKey} = await this.exportPrivateKey(rawTx.from, pin);

        if (error) {
            return { error };
        }

        if (Chains.evmChains.includes(this.chain)) {
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
            return { error: errorMessage.INCORRECT_ENCRYPTION_KEY };
        }

        this.vault = vault;

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
            return { error: errorMessage.INCORRECT_PIN };
        };

        let chain = (Chains.evmChains.includes(this.chain) || this.chain === 'ethereum') ? 'eth' : this.chain;

        if (this.decryptedVault[chain].public.some(element => element.address === address) == false) {
            return { error: errorMessage.ADDRESS_NOT_PRESENT };
        }

        const objIndex = this.decryptedVault[chain].public.findIndex((obj => obj.address === address));

        this.decryptedVault[chain].public[objIndex].isDeleted = true;
        this.decryptedVault[chain].numberOfAccounts--;

        const vault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

        this.vault = vault;

        return { response: vault };
    }

}

module.exports = Keyring;