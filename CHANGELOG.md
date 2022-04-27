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
