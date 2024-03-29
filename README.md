# **Safle Vault SDK**

Safle Vault is a non-custodial, flexible and highly available crypto wallet which can be used to access dapps, send/receive crypto and store identity. Vault SDK is used to manage the vault and provide methods to generate vault, add new accounts, update the state and also enable the user to perform several vault related operations.  


## **Installation and Usage**

> Installation

Install the package by running the command,

`npm install @getsafle/safle-vault`

Import the package into your project using,

`const Vault = require('@getsafle/safle-vault');`

Initialise the vault class,

```
const vault = new Vault({ 
    vault,
    customEncryptor: {
    // An optional object for defining encryption schemes:
    // Defaults to crypto-js library
    encrypt(password, object) {
      return encryptedString;
    },
    decrypt(password, encryptedString) {
      return decryptedData;
    },
  },
  platform,
  storage,
});
```

* `vault` (optional) - If the user already has a vault string generated, then it can be passed as the first parameter. If the vault string is not passed, then the vault has to be generated using the `generateVault()` function.
* `customEncryptor` (optional) - If the user wants to use their own custom encryption/decryption function.
* `platform` (optional) - The platform on which the vault sdk is integrated with. This data will be helpful for logging purpose.
* `storage` (optional) - The storage mechanism for vault. Can be an array of strings incase there are multiple storage mechanisms.

If the vault is not yet generated, then pass the `vault` parameter as null.

> Methods

Generate Mnemonic: 
This method is used to generate the 12 word seed phrase for the vault.

`const mnemonic = await vault.generateMnemonic(entropy);`

* `entropy` (optional) - The entropy used to generate the 12 word seed phrase. (Uses crypto.randomBytes under the hood). Defaults to 128-bits of entropy.


Change Network
This method is used to switch the network if a transaction has to be signed for any network other than Ethereum

`await changeNetwork(chain)`

* `chain` - Name of the chain to change to. eg. `bsc`, `harmony`, etc.

Generate Vault:
This method is used to generate the vault using the mnemonic passed as parameter and encrypted by the encryption key and pin.

 `const userVault = await vault.generateVault(encryptionKey, pin, mnemonic);`

* `encryptionKey` - 64 bytes Uint8Array used to encrypt the vault.
* `pin` - The pin to access the vault's private functions.
* `mnemonic` - The mnemonic to generate the vault from.

Recover Vault:
This method is used to recover the vault using the mnemonic phrase. The new vault will be re-encrypted using the pin and encryption key.

 `const userVault = await vault.recoverVault(mnemonic, encryptionKey, pin, unmarshalApiKey);`

* `mnemonic` - The mnemonic of the vault to be recovered.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.
* `pin` - The pin to access the vault's private functions.
* `unmarshalApiKey` - API Key of unmarshal api.

Get supported chains:
Returns the list of all the supported EVM and non-EVM chains.

`const supportedChains = vault.getSupportedChains();`

Export Mnemonic:
This method is used to export the 12 word mnemonic phrase which was used to initialize the vault.

 `const mnemonic = await vault.exportMnemonic(pin);`

* `pin` - The pin to access the vault's private functions.

Validate PIN
This method is used to validate the PIN of the user's vault

`const isPinValid = await vault.validatePin(pin);`

* `pin` - User's vault pin.

Validate Mnemonic:
This method is used to validate the user's mnemonic by querying the first 0th address for its safleId.

`const isMnemonicValid = await vault.validateMnemonic(mnemonic, safleID, network, polygonRpcUrl);`
 
* `mnemonic` - The mnemonic phrase to be validated.
* `safleID` - The safleId of the user.
* `network` - The network to query the safleId. Valid values - `mainnet` or `testnet`.
* `polygonRpcUrl` - Polygon RPC URL. Must provide mainnet rpc if `network` is `mainnet` else mumbai rpc.

Get Accounts:
This method is used to get the list of all the accounts in the vault.

 `const accounts = await vault.getAccounts(encryptionKey);`

* `vault` - The encrypted vault string.
* `encryptionKey` - The encryption key used to decrypt the vault.

Export Private Key:
This method is used to export the private key of a particular address.

 `const privateKey = await vault.exportPrivateKey(address, pin);`

* `address` - The address for which the private key is to be exported.
* `pin` - The pin to access the vault's private functions.
* `encryptionKey` - The encryption key used to decrypt the vault.

Add Account:
This method is used to add an another account to the vault.

 `const userVault = await vault.addAccount(encryptionKey, pin);`

* `encryptionKey` - The encryption key used to decrypt the vault.
* `pin` - The pin to access the vault's private functions.
`Note: Call vault.restoreKeyringState() method before vault.addAccount() method is called`

Sign Message:
This method is used to sign a message.

 `const signedMessage = await vault.signMessage(address, data, pin, encryptionKey)`

* `address` - The address to sign the message from.
* `data` - The hash string of the data to be signed.
* `pin` - The pin to access the vault's private functions.
*  `encryptionKey` - The encryption key used to decrypt the vault.

Sign Transaction:
This method is used to sign a transaction.

 `const signedTransaction = await vault.signTransaction(rawTx,  pin, rpcUrl);`

* `rawTx` - The raw transaction object to be signed.
* `pin` - The pin to access the vault's private functions.
* `rpcUrl` - RPC URL of the chain for which the transaction is to be signed. 

Restore Keyring State
This method is used to restore the vault state in the keyring controller.
 
 `await vault.restoreKeyringState(vault, pin, encryptionKey);`

* `vault` - The encrypted vault string to be restored.
* `pin` - The pin to access the vault's private functions.
* `encryptionKey` - The encryption key used to decrypt the vault.

Delete Account:
This method is used to delete an account from the vault.

 `const userVault = await vault.deleteAccount(encryptionKey, address, pin);`

* `encryptionKey` - The encryption key used to decrypt the vault.
* `address` - The address to be deleted.
* `pin` - The pin to access the vault's private functions.

Import Wallet:
This method is used to import a new wallet using private key for all supported chains.

 `const userVault = await vault.importWallet(privateKey, pin, encryptionKey);`

* `privatekey` - The private key of the wallet to be imported.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.
* `pin` - The pin to access the vault's private functions.

List Active Chains:
This method is used to list all the chains for which the user has generated or imported a wallet.

 `const chainArray = await vault.getActiveChains();`

Get Vault Details:
This method is used to get the list of all the accounts (`imported` and `generated`) of all the supported chains.

 `const details = await vault.getVaultDetails(encryptionKey);`

* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.

Get Native Asset Balance:
This method is used to get the native asset balance of an address present in the vault.

 `const balance = await vault.getBalance(address, rpcUrl);`

* `address` - The public address for which the balance is to be fetched.
* `rpcUrl` - RPC URL of the chain for which the balance is to be fetched. To be left blank for bitcoin chain.

Sign a rawTx or message and get signature object as output:
This method is used to sign the rawTx object or message and get signature object as output.

 `const signedMessage = await vault.sign(data, address, pin, rpcUrl);`

* `data` - The rawTx object or message in string. If the message to be signed is in object format, then stringify the object before passing in the parameter.
* `address` - The public address for which the balance is to be fetched.
* `pin` - The pin to access the vault's private functions.
* `rpcUrl` - RPC URL of the chain.

Update Wallet Label:
This method is used to update the wallet label.

 `const updatedVault = await vault.updateLabel(address, encryptionKey, newLabel);`

* `address` - The address for which the label is to be updated.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.
* `newLabel` - The new label to be added.

Change Pin:
This method is used to change the pin of the vault.

 `const newPin = await vault.changePin(currentPin, newPin, encryptionKey);`

* `currentPin` - The existing vault pin.
* `newPin` - The new vault pin.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.

Get Logs:
This method retrieves all the logs of all the vault changes.

 `const logs = await vault.getLogs();`

Get Fees:
This method returns an object containing gas limit, gas price wrt the speed of transaction confirmation 

 `async getFees(rawTx, rpcUrl); `

* `rawTx` - The rawTx object containing the transaction details, e.g from, to , value, data, chainID
* `rpcUrl` - RPC URL of the chain.
 