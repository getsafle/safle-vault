# **Safle Vault SDK**

Safle Vault is a non-custodial, flexible and highly available crypto wallet which can be used to access dapps, send/receive crypto and store identity. Vault SDK is used to manage the vault and provide methods to generate vault, add new accounts, update the state and also enable the user to perform several vault related operations.  


## **Installation and Usage**

> Installation

Install the package by running the command,

`npm install @getsafle/safle-vault`

Import the package into your project using,

`const Vault = require('@getsafle/safle-vault');`

Initialise the vault class,

`const vault = new Vault(rpcURL, vault);`

If the vault is not yet generated, then pass the `vault` parameter as null.

Else, pass the encrypted vault string in the constructor along with the `rpcURL`.

> Methods

Get supported chains:
Returns the list of all the supported EVM and non-EVM chains.

`const supportedChains = vault.getSupportedChains();`

Generate Mnemonic: 
This method is used to generate the 12 word seed phrase for the vault.

`const mnemonic = await vault.generateMnemonic(entropy);`

* `entropy` (optional) - The entropy used to generate the 12 word seed phrase. (Uses crypto.randomBytes under the hood). Defaults to 128-bits of entropy.

Generate Vault:
This method is used to generate the vault using the mnemonic passed as parameter and encrypted by the encryption key and pin.

 `const userVault = await vault.generateVault(encryptionKey, pin, mnemonic);`

* `encryptionKey` - 64 bytes Uint8Array used to encrypt the vault.
* `pin` - The pin to access the vault's private functions.
* `mnemonic` - The mnemonic to generate the vault from.

Get Accounts:
This method is used to get the list of all the accounts in the vault.

 `const accounts = await vault.getAccounts(encryptionKey);`

* `vault` - The encrypted vault string.
* `encryptionKey` - The encryption key used to decrypt the vault.


Export Mnemonic:
This method is used to export the 12 word mnemonic phrase which was used to initialize the vault.

 `const mnemonic = await vault.exportMnemonic(pin);`

* `pin` - The pin to access the vault's private functions.


Export Private Key:
This method is used to export the private key of a particular address.

 `const privateKey = await vault.exportPrivateKey(address, pin);`

* `address` - The address for which the private key is to be exported.
* `pin` - The pin to access the vault's private functions.


Add Account:
This method is used to add an another account to the vault.

 `const userVault = await vault.addAccount(encryptionKey, pin);`

* `encryptionKey` - The encryption key used to decrypt the vault.
* `pin` - The pin to access the vault's private functions.

Sign Message:
This method is used to sign a message.

 `const signedMessage = await vault.signMessage(address, data, pin)`

* `address` - The address to sign the message from.
* `data` - The data to be signed.
* `pin` - The pin to access the vault's private functions.

Sign Transaction:
This method is used to sign a transaction.

 `const signedTransaction = await vault.signTransaction(rawTx, pin, chain);`

* `rawTx` - The raw transaction object to be signed.
* `pin` - The pin to access the vault's private functions.
* `chain` - The name of the chain for which the transaction has to be signed. eg. `ethereum`, `bsc`, `harmony`, etc.

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

Validate Mnemonic:
This method is used to validate the user's mnemonic by querying the first 0th address for its safleId.

`const isMnemonicValid = await vault.validateMnemonic(mnemonic, safleID);`
 
* `mnemonic` - The mnemonic phrase to be validated.
* `safleID` - The safleId of the user.

Recover Vault:
This method is used to recover the vault using the mnemonic phrase. The new vault will be re-encrypted using the pin and encryption key.

 `const userVault = await vault.recoverVault(mnemonic, encryptionKey, pin, etherscanApiKey, polygonscanApiKey);`

* `mnemonic` - The mnemonic of the vault to be recovered.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.
* `pin` - The pin to access the vault's private functions.
* `etherscanApiKey` - API Key of etherscan.
* `polygonscanApiKey` - API Key of polygonscan.

Validate PIN
This method is used to validate the PIN of the user's vault

`const isPinValid = await vault.validatePin(pin);`

* `pin` - User's vault pin.

Change Network
This method is used to switch the network if a transaction has to be signed for any network other than Ethereum

`await changeNetwork(chain)`

* `chain` - Name of the chain to change to. eg. `bsc`, `harmony`, etc.

Import Wallet:
This method is used to import a new wallet using private key for all supported chains.

 `const userVault = await vault.importWallet(privateKey, pin, encryptionKey);`

* `privatekey` - The private key of the wallet to be imported.
* `encryptionKey` - The encryption key used to encrypt/decrypt the vault.
* `pin` - The pin to access the vault's private functions.

List Active Chains:
This method is used to list all the chains for which the user has generated or imported a wallet.

 `const chainArray = await vault.getActiveChains();`
