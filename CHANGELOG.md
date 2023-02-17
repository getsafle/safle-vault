### 1.0.0 (2021-08-31)

##### Initial commit

* Generate Mnemonic
* Generate a new vault
* Get the list of accounts
* Export mnemonic
* Export private keys
* Add a new account to the keyring
* Sign message
* Sign transaction
* Delete account
* Recover vault
* Added github actions workflow

### 1.1.0 (2021-10-13)

##### Added support for EIP-1559 Tx Signing

* Implemented method to sign eip1559 transactions

### 1.1.1 (2021-11-16)

##### Updated constructor parameter

* Updated the constructor parameter to initialize the SDK using the encrypted vault string

### 1.1.2 (2021-11-22)

##### Updated transaction signing method

* Implemented the updated vault-eth-controller sdk to sign eip1559 transactions.

### 1.1.3 (2021-11-23)

##### Added method to validate PIN

* Implemented the method to validate the user's PIN.

### 1.1.4 (2021-11-25)

##### Updated the validatePin function call

* Fixed the issue where some function were calling the validatePin function incorrectly.
* Updated the variable to return the error messages from `response` to `errorMessage` since `response` was conflicting with the function success.

### 1.1.5 (2021-11-29)

##### Persist the updated vault in the local storage

* Fixed the issue where the updated vault was not getting stored in the local storage.
* Updated the README with the new constructor initialization and also the `validatePin` function.

### 1.2.0 (2021-12-01)

##### Integrated BSC controller

* Integrated the BSC controller with the vault.

### 1.2.1 (2021-12-30)

##### Updated BSC controller package

* Updated the bsc controller package.
Deprecated package was `@getsafle/bsc-wallet-controller` and updated one is `@getsafle/vault-bsc-controller`.

### 1.2.2 (2021-12-30)

##### Integrated Polygon controller

* Integrated the [Polygon wallet controller](https://github.com/getsafle/vault-polygon-controller).

### 1.2.3 (2021-12-30)

##### Integrated Bitcoin controller

* Integrated the [Bitcoin wallet controller](https://github.com/getsafle/vault-bitcoin-controller).

### 1.2.4 (2022-01-05)

##### Delete account for non-eth chains

* Extended the functionality to delete an account for all the chains.

### 1.2.5 (2022-01-10)

##### Get the list of all the supported chains

* Implemented a method to get the list of all the supported EVM and non-EVM chains.

### 1.2.6 (2022-01-12)

##### Integrated Harmony Controller

* Integrated the [Harmony wallet controller](https://github.com/getsafle/vault-harmony-controller).

### 1.2.7 (2022-01-12)

##### Integrated Avalanche Controller

* Integrated the [Avalanche wallet controller](https://github.com/getsafle/vault-avalanche-controller).

### 1.2.8 (2022-01-13)

##### Integrated Velas Controller

* Integrated the [Velas vault controller](https://github.com/getsafle/vault-velas-controller).

### 1.2.9 (2022-01-18)

##### Integrated Transaction Controller

* Integrated the [Transaction Controller](https://github.com/getsafle/transaction-controller) for asset discovery on Ethereum and Polygon chains for vault recovery.

### 1.3.0 (2022-01-24)

##### Method to validate mnemonic

* Added a method to validate the mnemonic phrase of the user.

### 1.4.0 (2022-01-29)

##### Import Wallets

* Created a method to import a wallet using private key for all the supported chains.

### 1.5.0 (2022-01-29)

##### List active chains

* Created a method to get the list of chains for which the user has generated or imported a wallet.

### 1.5.1 (2022-01-31)

##### Import wallet function return the public address

* Updated the importWallet function to return the public address of the private key along with the encrypted vault string.

### 1.5.2 (2022-02-05)

##### Updated `getActiveChains()` and `getSupportedChains()`

* Updated the `getActiveChains()` and `getSupportedChains()` functions to return the chains along with their symbols.

### 1.6.0 (2022-02-10)

##### Added logging functionality

* All the functions which changes the state of the vault now also maintains a log of the changes.
* Implemented a function to retrieve all the logs `getLogs()`.
* BREAKING CHANGE: `addAccounts()` function now returns an object with vault and the newly added account.

### 1.7.0 (2022-03-08)

##### Added a function to get the detailed list of all the accounts for all chains [Breaking Changes]

* Added a function (`getVaultDetails()`) to get the detailed list of all accounts for all chains. Implemented token detection for all evm supported wallets for eth and polygon chains.
* BREAKING CHANGE: Vault initialization accepts only the vault string as the parameter. If the vault has not been generated, then the constructor will be empty.
* BREAKING CHANGE: `recoverVault()` function also accepts `rpcUrl` as the parameter.
* BREAKING CHANGE: `signTransaction()` function also accepts `rpcUrl` as the parameter.

### 1.8.0 (2022-03-09)

##### Added a function to get the native asset balance of an account

* Added a function (`getBalance()`) to get the native asset balance for an address.

### 1.9.0 (2022-03-10)

##### Added a function to sign a message or rawTx and get signature object

* Added a function (`sign()`) to sign a transaction object or message and get the signature object.

### 1.9.1 (2022-03-16)

##### Added pin validation

* Added a validation to ensure that the pin entered is a positive integer value

### 1.9.2 (2022-03-22)

##### Fixed bug where user cannot delete imported wallets

* Fixed bug where user cannot delete imported wallets.

### 1.10.0 (2022-04-08)

##### Integrated BSC chain

* Integrated BSC chain wallet scanning for `recoverVault()` function.
* Integrated BSC chain for `getVaultDetails()` function.

### 1.10.1 (2022-04-15)

##### [Bugfix]: Fixed the bug where the user was unable to export the private keys of their bitcoin wallet

* Fixed the bug where the user was unable to export the private keys of their bitcoin wallet

### 1.10.2 (2022-04-15)

##### [Bugfix]: `importWallet()` function can be used to import an already existing wallet

* `importWallet()` function throws an error if the address is already present in the vault.
* Implemented lodash library to query the nested object keys for all functions.

### 1.10.3 (2022-04-18)

##### [Bugfix]: `importWallet()` function throws an error when importing a non evm wallet

* Added a condition in the `importWallet()` function to check if the output of the `getAccounts()` is an error.

### 1.11.0 (2022-04-19)

##### Wallet label

* Every address in the vault will have a default wallet label.
* Added the functionality to change the wallet label - `updateLabel()`.

### 1.11.1 (2022-04-22)

##### Added the wallet label in `getVaultDetails()` function.

* `getVaultDetails()` will also return the wallet label in the output.

### 1.11.2 (2022-04-25)

##### [BugFix] `validatePin()` function.

* `validatePin()` fix an issue where the function returned an uncaught error `Malformed UTF-8 data`.

### 1.11.3 (2022-04-26)

##### [BugFix] Error when generate bitcoin account for the first time.

* Fixed an issue where the user was unable to generate a bitcoin wallet for the first time.

### 1.12.0 (2022-04-28)

##### Updated the `restoreKeyringState()` function to restore the state for non-evm chains too

* Updated the `restoreKeyringState()` function to restore the state for non-evm chains too.

### 1.12.1 (2022-05-11)

##### Removed the condition which checks if the address is present in the vault to get the balance

* Removed the condition which checks if the address is present in the vault to get the balance.

### 1.13.0 (2022-05-17)

##### Integrated Solana chain

* Integrated Solana vault controller for generating solana wallets and perform operations.

### 1.14.0 (2022-05-17)

##### Integrated Tezos chain

* Integrated Tezos vault controller for generating tezos wallets and perform operations.

### 1.15.0 (2022-05-18)

##### [BREAKING Changes] Segregated the functionality of `getVaultDetails()` function into 2 diferent functions.

* `getVaultDetails()` function will only return the address of all the chains
* Created a new function `getAssets()` which returns the list of assets for all the addresses on all the chains passed in an array.

### 1.15.1 (2022-05-19)

##### [Bug] Fixed duplicate address issue.

* Fixed the issue where the addresses generated after executing `restoreKeyringState()` are duplicates.

### 1.15.2 (2022-05-23)

##### Removed Tezos integration.

* Removed tezos integration due to some compatibility issue in the tezos controller with RN framework.

### 1.15.3 (2022-05-27)

##### Updated Polygon controller version.

* Updated Polygon controller version to support type2 transaction signing.

### 1.16.0 (2022-05-27)

##### [BREAKING] Added network selection for `validateMnemonic()` function.

* [BREAKING] Added network selection for `validateMnemonic()` function.

### 1.17.0 (2022-06-06)

##### `changePin()` function.

* Implemented a function to change the vault pin.

### 1.17.1 (2022-06-09)

##### [Breaking] `changePin()` function returns the new vault string.

* `changePin()` function returns the new vault string.
* Added a new parameter `encryptionKey`.

### 1.18.0 (2022-06-10)

##### Removed `velas`, `avalanche`, `solana` and `harmony` chain integration.

* Removed `velas`, `avalanche`, `solana` and `harmony` chain integration.

### 1.18.1 (2022-06-13)

##### Uncaught error in `validateMnemonic()`.

* Added error handling for an uncaught error when user inputs an invalid mnemonic in the `validateMnemonic()` function .

### 1.18.2 (2022-06-24)

##### Updated `safle-identity-wallet` package version.

* Updated `safle-identity-wallet` package version.
* [Breaking Change] - `validateMnemonic()` also accepts polygonRpcUrl.

### 1.18.3 (2022-06-30)

##### Updated the condition check for pin in the `generateVault()` function.

* Updated the condition check for pin in the `generateVault()` function. Now users can also choose `000000` as the pin.

### 1.19.0 (2022-06-23)

##### Added a functionality for the host app to plug in their own encryption decryption functions

* The developer who wants to integrate the safle-vault sdk can inject their own encryption/decryption function in the constructor. The functions can be passed inside `encryptor` object.
* [Breaking Change] - Constructor parameters have to be passed as an object.

### 1.20.0 (2022-07-20)

##### Added a extra optional parameter (`platform`) in the constructor

* The constructor accepts a new optional parameter called `platform` which will be saved in the logs.

### 1.18.4 (2022-08-24)

##### Fixed the bsc chain naming convention from `binance smart chain` to `bsc`.

* Fixed the bsc chain naming convention from `binance smart chain` to `bsc`.

### 1.18.5 (2022-08-29)

##### Fixed a bug which prevented a user from importing the same account post deleting it

* Fixed a bug which prevented a user from importing the same account post deleting it

### 1.18.6 (2022-09-07)

##### Updated BTC vault controller version

* Updated BTC vault controller version and fixed Bitcoin transaction signing issue

### 1.18.7 (2022-09-14)

##### Updated transaction controller version

* Updated transaction controller version

### 1.18.8 (2022-09-16)

##### Updated bitcoin controller version

* Updated bitcoin controller version to fix the utxo calculation while transaction signing.

### 1.21.0 (2022-10-17)

##### Rebase the different released versions into one single version

* Rebased the versions 1.19.0, 1.20.0, 1.18.4, 1.18.5, 1.18.6, 1.18.7 and 1.18.8 into a new version 1.21.1

### 1.21.1 (2022-10-17)

##### Track which address has exported their private key

* Every address has a new flag `isExported` associated with it to track if the private key of that address has been exported.
* [Breaking Change] encryptedEncryptionKey has to be passed in the `exportPrivateKey()`, `signTransaction()` and `sign()`function.

### 1.21.2 (2022-10-17)

##### Updated the output of `getVaultDetails()` function to make it more consistent

* Updated the output of `getVaultDetails()` function to make it more consistent. All the wallet objects are returned in an array inside the `generatedWallets` or `importedWallets` object under their respective chains.

### 1.22.0 (2022-10-17)

##### Constructor also accepts the parameter `storage`

* Constructor also accepts the parameter `storage` where the developer can pass the vault storage mechanisms as an array.

### 1.23.0 (2022-10-18)

##### Function to restore the deleted wallets

* Created a function (`restoreAccount()`) to restore the deleted wallets.

### 1.24.0 (2022-10-18)

##### Enabled the user to change the wallet label for a specific EVM chain

* Enabled the user to change the wallet label for a specific EVM chain.
* [Breaking Change] - `updateLabel()` function accepts an extra parameter `chainName` which is the name of the EVM chain for which the label is to be updated.

### 1.24.1 (2022-10-18)

##### Updated the vault logs parameter

* Updated the vault logs parameters by removing the vault string and adding the platform and storage values.

### 1.24.2 (2022-10-20)

##### New release with all the functionalities till v1.24.1

* New release with all the functionalities till v1.24.1.

### 1.24.3 (2023-01-25)

##### Fixed bug with recover vault

### 1.24.4 (2023-02-03)
##### Backward compatiblity for updateLabel

* Implemented backward compatiblity for update label method for wallets created on versions before 1.24.1

### 1.26.0 (2023-02-17)

* Stable release 1.26.0 


