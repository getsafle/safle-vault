const CryptoJS = require("crypto-js");
const { KeyringController } = require("@getsafle/vault-evm-controller");
const BitcoinKeyringController =
  require("@getsafle/vault-bitcoin-controller").KeyringController;
const StacksKeyringController =
  require("@getsafle/vault-stacks-controller").KeyringController;
const SolanaKeyringController =
  require("@getsafle/vault-sol-controller").KeyringController;
const bip39 = require("bip39");

const helper = require("../utils/helper");
const Keyring = require("./keyring");
const Chains = require("../chains");

const ERROR_MESSAGE = require("../constants/responses");

class Vault extends Keyring {
  constructor({ vault, encryptionKey }) {
    super();
    this.chain = "ethereum";
    this.vault = vault;
    this.initializeKeyringController();
    if (vault && encryptionKey) {
      this.initializeDecryptedVault(vault, encryptionKey);
    }
  }

  initializeDecryptedVault(vault, encryptionKey) {
    const { decryptedVault, error } = helper.validateEncryptionKey(
      vault,
      JSON.stringify(encryptionKey)
    );
    if (error) {
      return { error };
    }
    this.decryptedVault = decryptedVault;
  }

  initializeKeyringController() {
    const evmChainInfo = Chains.getEvmChainInfo(this.chain);
    const keyringController = new KeyringController({
      txType: evmChainInfo.txType,
      persistKeyrings: this.keyringInstance?.keyrings,
      persistStore: this.keyringInstance?.store,
      persistmemStore: this.keyringInstance?.memStore,
      persistImported: this.keyringInstance?.importedWallets,
      encryptor: {
        encrypt(pass, object) {
          const ciphertext = CryptoJS.AES.encrypt(
            JSON.stringify(object),
            pass
          ).toString();
          return ciphertext;
        },
        decrypt(pass, encryptedString) {
          const bytes = CryptoJS.AES.decrypt(encryptedString, pass);
          const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          return decryptedData;
        },
      },
    });

    this.keyringInstance = keyringController;
  }

  initializeSupportedChainKeyringController(mnemonic) {
    const keyringController = new BitcoinKeyringController({
      mnemonic: mnemonic,
    });
    this["bitcoin"] = keyringController;

    const stacksKeyringController = new StacksKeyringController({
      mnemonic: mnemonic,
    });
    this["stacks"] = stacksKeyringController;

    const solanaKeyringController = new SolanaKeyringController({
      mnemonic: mnemonic,
    });
    this["solana"] = solanaKeyringController;
  }

  async generateMnemonic(entropy) {
    var mnemonic;

    if (entropy) {
      mnemonic = bip39.entropyToMnemonic(entropy);
    } else {
      mnemonic = bip39.generateMnemonic();
    }

    return mnemonic;
  }

  async changeNetwork(chain) {
    if (
      !Chains.evmChains.hasOwnProperty(chain) &&
      !Chains.nonEvmChains.hasOwnProperty(chain)
    ) {
      throw ERROR_MESSAGE.CHAIN_NOT_SUPPORTED;
    }
    this.chain = chain;
    if (Chains.evmChains.hasOwnProperty(chain)) {
      this.initializeKeyringController();
    }
  }
  async getChainInfo(chain) {
    return Chains.getEvmChainInfo(chain);
  }

  async addNetwork(chainName, chainInfo) {
    try {
      Chains.addEvmChain(chainName, chainInfo);
      return { response: `Network ${chainName} added successfully` };
    } catch (error) {
      return { error: error.message };
    }
  }

  async generateVault(encryptionKey, pin, mnemonic) {
    if (
      typeof pin != "string" ||
      pin.match(/^[0-9]+$/) === null ||
      pin < 0 ||
      pin.length != 6
    ) {
      return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
    }

    if (!encryptionKey || pin === undefined || pin === null) {
      return { error: ERROR_MESSAGE.ENTER_CREDS };
    }

    await this.keyringInstance.createNewVaultAndRestore(
      JSON.stringify(encryptionKey),
      mnemonic
    );

    const accounts = await this.keyringInstance.getAccounts();

    const privData = await helper.generatePrivData(mnemonic, pin);

    const rawVault = {
      eth: {
        public: [
          {
            address: accounts[0],
            isDeleted: false,
            isImported: false,
            label: "EVM Wallet 1",
          },
        ],
        private: privData,
        numberOfAccounts: 1,
      },
    };

    this.initializeSupportedChainKeyringController(mnemonic);

    for (const chain of Object.keys(Chains.nonEvmChains)) {
      let addedAcc;
      if (chain === "stacks") {
        addedAcc = (await this[chain].generateWallet()).address;
      } else {
        addedAcc = (await this[chain].addAccount()).address;
      }
      let label = `${Chains.nonEvmChains[chain]} Wallet 1`;
      rawVault[chain] = {
        public: [
          {
            address: addedAcc,
            isDeleted: false,
            isImported: false,
            label: label,
          },
        ],
        numberOfAccounts: 1,
      };
    }

    const vault = await helper.cryptography(
      JSON.stringify(rawVault),
      JSON.stringify(encryptionKey),
      "encryption"
    );

    this.initializeDecryptedVault(vault, encryptionKey);

    this.vault = vault;

    this.logs.updateState({
      logs: [
        {
          timestamp: Date.now(),
          action: "vault-generation",
          vault: this.vault,
        },
      ],
    });

    return { response: vault };
  }

  async recoverVault(
    mnemonic,
    encryptionKey,
    pin,
    unmarshalApiKey,
    recoverMechanism = "transactions",
    logs = {}
  ) {
    if (
      typeof pin != "string" ||
      pin.match(/^[0-9]+$/) === null ||
      pin < 0 ||
      pin.length != 6
    ) {
      return { error: ERROR_MESSAGE.INCORRECT_PIN_TYPE };
    }

    if (!encryptionKey) {
      return { error: ERROR_MESSAGE.ENTER_CREDS };
    }

    if (recoverMechanism === "transactions" && !unmarshalApiKey) {
      return { error: ERROR_MESSAGE.INVALID_API_KEY };
    }

    const vaultState = await this.keyringInstance.createNewVaultAndRestore(
      JSON.stringify(encryptionKey),
      mnemonic
    );

    let accountsArray = [];
    if (recoverMechanism === "transactions") {
      accountsArray = await helper.getAccountsFromTransactions(
        vaultState.keyrings[0].accounts[0],
        this.keyringInstance,
        vaultState,
        unmarshalApiKey
      );
    } else if (recoverMechanism === "logs") {
      accountsArray = await helper.getAccountsFromLogs(
        "ethereum",
        this.keyringInstance,
        vaultState,
        logs,
        vaultState.keyrings[0].accounts[0]
      );
    }

    const privData = await helper.generatePrivData(mnemonic, pin);

    const numberOfAccounts = accountsArray.length;

    let rawVault = {
      eth: { public: accountsArray, private: privData, numberOfAccounts },
    };

    const nonEvmChainList = Object.keys(Chains.nonEvmChains);

    //generate other chain's keyring instance and get accounts from logs
    let obj = {};
    for (let chain of nonEvmChainList) {
      const keyringInstance = await helper.getCoinInstance(
        chain.toLowerCase(),
        mnemonic
      );
      let address;
      if (chain === "stacks") {
        address = (await keyringInstance.generateWallet()).address;
      } else {
        address = (await keyringInstance.addAccount()).address;
      }

      const accArray = await helper.getAccountsFromLogs(
        chain,
        keyringInstance,
        vaultState,
        logs,
        address
      );

      if (chain === "stacks") {
        for (let ele of accArray) {
          ele.address = ele.address.toUpperCase();
        }
      }
      const numberOfAcc = accArray.length;

      rawVault[chain.toLowerCase()] = {
        public: accArray,
        numberOfAccounts: numberOfAcc,
      };
    }

    this.decryptedVault = rawVault;

    const vault = await helper.cryptography(
      JSON.stringify(rawVault),
      JSON.stringify(encryptionKey),
      "encryption"
    );

    this.vault = vault;

    this.logs.getState().logs.push({
      timestamp: Date.now(),
      action: "vault-recovery",
      vault: this.vault,
    });

    return { response: vault };
  }

  getSupportedChains() {
    const evmChains = Chains.evmChains;
    const nonEvmChains = Chains.nonEvmChains;

    return { response: { evmChains, nonEvmChains } };
  }
}

module.exports = Vault;
