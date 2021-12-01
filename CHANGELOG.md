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
