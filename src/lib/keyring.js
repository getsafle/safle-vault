const Tx = require('ethereumjs-tx').Transaction;

const helper = require('../utils/helper');
const { DEFAULT_GAS_LIMIT } = require('../config');
const { INVALID_PUBLIC_ADDRESS, INVALID_RPC_RESPONSE, NONEXISTENT_KEYRING_ACCOUNT } = require('../constants/responses')

class Keyring {

    async extractKeyring(vault, password) {
        const { response: encryptedKeyring } = await helper.decryptVault(vault, password);
    
        const { response: keyring } = await helper.decryptKeyring(encryptedKeyring, password, this.keyringInstance);
    
        return { response: keyring }
    }

    async getAccounts() {
        const accounts = await this.keyringInstance.getAccounts();
    
        return { response: accounts }
    }

    async signMessage(address, data) {
        const accounts = await this.keyringInstance.getAccounts();

        if (accounts.includes(address) === false) {
            return { error: NONEXISTENT_KEYRING_ACCOUNT };
        }

        const msg = await helper.stringToArrayBuffer(data);

        const msgParams = { from: address, data: msg };

        const signedMsg = await this.keyringInstance.signMessage(msgParams);

        return { response: signedMsg };
    }

    async signTransaction(rawTx, password) {
        try {
            const { error } = await helper.validateTxData(rawTx, this.keyringInstance);

            if (error) {
                return { error }
            }
        
            this.keyringInstance.password = password;
        
            const defaultGasPrice = await this.web3.eth.getGasPrice();

            const count = await this.web3.eth.getTransactionCount(rawTx.from);

            const defaultNonce = await this.web3.utils.toHex(count);

            const rawTxObj = {
                to: rawTx.to,
                from: rawTx.from,
                value: rawTx.value || '0x00',
                gasPrice: this.web3.utils.toHex(rawTx.gasPrice) || this.web3.utils.toHex(defaultGasPrice),
                gas: this.web3.utils.numberToHex(rawTx.gasLimit) || this.web3.utils.numberToHex(DEFAULT_GAS_LIMIT),
                data: rawTx.data || '0x00',
                nonce: rawTx.nonce || defaultNonce,
            };
        
            let network;

            await this.web3.eth.net.getNetworkType().then((e) => network = e);

            const privateKey = await this.keyringInstance.exportAccount(rawTx.from);

            const pkey = Buffer.from(privateKey, 'hex');

            let tx;

            if (network === 'main') {
                tx = new Tx(rawTxObj, { chain: 'mainnet' });
            } else {
                tx = new Tx(rawTxObj, { chain: network });
            }

            tx.sign(pkey);
            const signedTx = `0x${tx.serialize().toString('hex')}`;

            return { response: signedTx };
        } catch (error) {
            if (error.message === 'The field to must have byte length of 20') {
                return { error: INVALID_PUBLIC_ADDRESS };
            }

            return { error: INVALID_RPC_RESPONSE };
        }
    }

}

module.exports = Keyring;