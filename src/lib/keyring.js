const cryptojs = require('crypto-js');

const helper = require('../utils/helper');

const response = require('../constants/responses');

class Keyring {

    async exportMnemonic(pin) {
        const mnemonicBytes = cryptojs.AES.decrypt(this.decryptedVault.eth.private.encryptedMnemonic, pin);

        const mnemonic = mnemonicBytes.toString(cryptojs.enc.Utf8);

        if(mnemonic == '') {
            return { error: response.INCORRECT_PIN };
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

    async getAccounts(encryptionKey) {
        const bytes = cryptojs.AES.decrypt(this.vault, JSON.stringify(encryptionKey));

        let decryptedVault;

        try {
            decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
            this.decryptedVault = decryptedVault;
        } catch(error) {
            return { error: response.INCORRECT_ENCRYPTION_KEY };
        }

        const accounts = decryptedVault.eth.public;
    
        return { response: accounts }
    }

    async exportPrivateKey(address, pin) {
        if(this.decryptedVault.eth.public.some(element => element.address === address) == false) {
            return { error: response.ADDRESS_NOT_PRESENT };
        }

        const { response } = await validatePin(pin)

        if(response == false) {
            return { error: response.INCORRECT_PIN };
        }; 

        const privateKey = await this.keyringInstance.exportAccount(address)
    
        return { response: privateKey }
    }

    async addAccount(encryptionKey, pin) {
        const { response } = await validatePin(pin)

        if(response == false) {
            return { error: response.INCORRECT_PIN };
        }; 
    
        const accounts = await this.keyringInstance.getAccounts();

        const keyring = await this.keyringInstance.getKeyringForAccount(accounts[0]);

        await this.keyringInstance.addNewAccount(keyring);

        const newAccount = await this.keyringInstance.getAccounts();

        this.decryptedVault.eth.public.push({ address: newAccount[newAccount.length - 1], isDeleted: false })
        this.decryptedVault.eth.numberOfAccounts++;
                    
        const encryptedVault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();
    
        return { response: encryptedVault }
    }

    async signMessage(address, data, pin) {
        const { response } = await validatePin(pin)

        if(response == false) {
            return { error: response.INCORRECT_PIN };
        }; 

        const accounts = await this.keyringInstance.getAccounts();
        
        if (accounts.includes(address) === false) {
            return { error: response.NONEXISTENT_KEYRING_ACCOUNT };
        }

        const msg = await helper.stringToArrayBuffer(data);

        const msgParams = { from: address, data: msg };

        const signedMsg = await this.keyringInstance.signMessage(msgParams);

        return { response: signedMsg };
    }

    async signTransaction(rawTx, pin) {
        const { response } = await validatePin(pin)

        if(response == false) {
            return { error: response.INCORRECT_PIN };
        }; 

        const signedTx = await this.keyringInstance.signTransaction(rawTx,this.web3);

        return { response: signedTx };
    }

    async restoreKeyringState(vault, pin, encryptionKey) {
        const bytes = cryptojs.AES.decrypt(vault, JSON.stringify(encryptionKey));

        let decryptedVault;

        try {
            decryptedVault = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
            this.decryptedVault = decryptedVault;
        } catch(error) {
            return { error: response.INCORRECT_ENCRYPTION_KEY };
        }

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
        const { response } = await validatePin(pin)

        if(response == false) {
            return { error: response.INCORRECT_PIN };
        }; 

        const accounts = await this.keyringInstance.getAccounts();
        
        if (accounts.includes(address) === false) {
            return { error: response.ADDRESS_NOT_PRESENT };
        };

        const objIndex = this.decryptedVault.eth.public.findIndex((obj => obj.address === address));

        this.decryptedVault.eth.public[objIndex].isDeleted = true;

        const vault = cryptojs.AES.encrypt(JSON.stringify(this.decryptedVault), JSON.stringify(encryptionKey)).toString();

        return { response: vault };
    }

}

module.exports = Keyring;