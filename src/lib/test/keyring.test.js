jest.setTimeout(30000);
const crypto = require("crypto");
const assert = require("assert");
const { before } = require("lodash");
let KeyRing = require("../keyring");
let Vault = require("../vault");
require("dotenv").config();
const helper = require("../../utils/helper");
const sigUtil = require("eth-sig-util");
const Web3 = require("web3");
let NETWORKS = {
  ethereum: {
    URL: "https://sepolia.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 11155111,
  },
  bsc: {
    URL: "https://bsc-testnet.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 97,
  },
  polygon: {
    URL: "https://polygon-amoy.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 80002,
  },
  optimism: {
    URL: "https://optimism-sepolia.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 11155420,
  },
  arbitrum: {
    URL: "https://arbitrum-sepolia.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 421614,
  },
  mantle: {
    URL: "https://mantle-sepolia.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 5003,
  },
  // velas: {
  //   URL: "https://explorer.testnet.velas.com/rpc",
  //   CHAIN_ID: 111,
  // },
  avalanche: {
    URL: "https://avalanche-fuji.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 43113,
  },
  base: {
    URL: "https://base-sepolia.infura.io/v3/0611b8c478b14db0b7d29e51466ff925",
    CHAIN_ID: 84532,
  },
  zkEVM: {
    URL: "https://1rpc.io/polygon/zkevm",
    CHAIN_ID: 1442,
  },
  bevm: {
    URL: "https://testnet.bevm.io/",
    CHAIN_ID: 1978,
  },
  rootstock: {
    URL: "https://public-node.testnet.rsk.co",
    CHAIN_ID: 31,
  },
};

//uncomment the below if statement to run test for bitcoin and make sure you override the balance check in bitcoin controller
if (!helper.isTestEnvironment()) {
  NETWORKS = {
    bitcoin: {
      URL: "https://bitcoin-mainnet.gateway.tatum.io",
      CHAIN_ID: 999999,
    },
    ...NETWORKS,
  };
}

const chainConfigs = {
  ethereum: { symbol: "ETH", txType: 2 },
  bsc: { symbol: "BSC", txType: 0 },
  polygon: { symbol: "MATIC", txType: 2 },
  optimism: { symbol: "OP", txType: 2 },
  arbitrum: { symbol: "ARB", txType: 2 },
  mantle: { symbol: "MNT", txType: 2 },
  // velas: { symbol: "VLX", txType: 0 },
  avalanche: { symbol: "AVAX", txType: 2 },
  base: { symbol: "BASE", txType: 2 },
  zkEVM: { symbol: "ZKEVM", txType: 2 },
  bevm: { symbol: "BTC", txType: 0 },
  rootstock: { symbol: "RBTC", txType: 0 },
  bitcoin: { symbol: "BTC", txType: 0 },
};

// Add the helper function
const getNetworkConfig = (chainName) => {
  const network = NETWORKS[chainName];
  const chainConfig = chainConfigs[chainName];
  return {
    url: network.URL,
    chainId: network.CHAIN_ID,
    symbol: chainConfig.symbol,
    txType: chainConfig.txType,
  };
};

const bufView = [
  48, 0, 236, 187, 187, 172, 177, 90, 255, 184, 9, 116, 142, 96, 197, 158, 87,
  35, 26, 101, 187, 30, 116, 138, 50, 131, 166, 50, 51, 197, 198, 83, 238, 167,
  105, 178, 182, 108, 174, 199, 124, 141, 155, 73, 21, 85, 81, 109, 78, 233,
  152, 108, 242, 238, 192, 31, 147, 86, 174, 195, 55, 229, 4, 36,
];
let phrase = process.env.MNEMONIC;
let pin = process.env.PIN;
let result;
let vault = new Vault({});
let vaultAddress;
let privateKey;
let accAddress;
let privateKeyImp = process.env.PRIVATE_KEY_EVM;
let privateKeybtcImp = process.env.PRIVATE_KEY_BTC;
let impAccAddress;

let chains;
const ethUrl = "https://mainnet.infura.io/v3/6145d532688844c4b6db32574d90e19f";
const polygonRpcUrl = "https://polygon.llamarpc.com";
const bscRpcUrl = "https://rpc.ankr.com/bsc";
beforeAll(async () => {
  result = await vault.generateVault(bufView, pin, phrase);

  vaultAddress = result.response;
  await vault.getAccounts(bufView);
});
describe("exportMnemonic", () => {
  test("Valid exportMnemonic/invalid pin", async () => {
    let result = await new KeyRing().exportMnemonic(1111);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("Valid exportMnemonic/INCORRECT_PIN", async () => {
    let result = await new KeyRing().exportMnemonic("111111");
    expect(result.error).toBe("Incorrect pin");
  });

  test("Valid exportMnemonic/INCORRECT_PIN_TYPE", async () => {
    try {
      let resultResp = await vault.exportMnemonic("srdtfyu");
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("Valid exportMnemonic", async () => {
    let resultResp = await vault.exportMnemonic(pin);
    expect(resultResp).toHaveProperty("response");
  });
});

describe("validatePin", () => {
  test("validatePin/invalid string", async () => {
    try {
      let result = await new KeyRing().validatePin("234rewtetyrjtuky");
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("validatePin/empty pin", async () => {
    try {
      let result = await new KeyRing().validatePin(null);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("validatePin/valid pin", async () => {
    let result = await vault.validatePin(pin);
    expect({ response: true }).toMatchObject(result);
  });
});

describe("addAccount", () => {
  test("addAccount/valid", async () => {
    let result = await vault.addAccount(bufView, pin);
    accAddress = result.response.address;

    expect(result.response).toHaveProperty("address");
  });

  test("addAccount/empty encryption key", async () => {
    try {
      let result = await vault.addAccount(null, pin);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });

  test("addAccount/empty pin", async () => {
    let result = await vault.addAccount(bufView, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("addAccount/invalid pin", async () => {
    let result = await vault.addAccount(bufView, 123333);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("addAccount/incorrect pin", async () => {
    let result = await vault.addAccount(bufView, "123333");
    expect(result.error).toBe("Incorrect pin");
  });
  test("addAccount/both param empty", async () => {
    let result = await vault.addAccount("", "");
    expect(result.error).toBe("Wrong pin type, format or length");
  });
});

describe("exportPrivateKey", () => {
  test("exportPrivateKey/valid", async () => {
    let result = await vault.exportPrivateKey(accAddress, pin);
    privateKey = result.response.privateKey;
  });

  test("exportPrivateKey/empty accAddress", async () => {
    try {
      let result = await vault.exportPrivateKey(null, pin);
    } catch (e) {
      expect(e.message).toBe(
        "Cannot read properties of null (reading 'toLowerCase')"
      );
    }
  });

  test("exportPrivateKey/empty pin", async () => {
    let result = await vault.exportPrivateKey(accAddress, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });

  test("exportPrivateKey/both empty", async () => {
    let result = await vault.exportPrivateKey(null, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("exportPrivateKey/incorrect pin", async () => {
    let result = await vault.exportPrivateKey(accAddress, "111111");
    expect(result.error).toBe("Incorrect pin");
  });
});

describe("importWallet", () => {
  const evmaddresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  const bitcoinadresses = [
    process.env.BITCOIN_ADDRESS_1,
    process.env.BITCOIN_ADDRESS_2,
  ];
  Object.keys(NETWORKS).map((chainName) => {
    const networkConfig = getNetworkConfig(chainName);

    let addresses;
    let impprivatekey;
    if (chainName == "bitcoin") {
      addresses = bitcoinadresses;
      impprivatekey = privateKeybtcImp;
    } else {
      addresses = evmaddresses;
      impprivatekey = "0x" + privateKeyImp;
    }

    test(`importWallet/valid import ${chainName}`, async () => {
      let var1 = chainName;
      let var2 = impprivatekey;
      vault.changeNetwork(chainName);
      let result = await vault.importWallet(impprivatekey, pin, bufView);
      impAccAddress = result.response.address;

      expect(result).toHaveProperty("response.address");
    });

    test("importWallet/valid address exists already", async () => {
      let result = await vault.importWallet(impprivatekey, pin, bufView);
      expect(result.response).toHaveProperty("vault");
    });

    test("importWallet/empty private key", async () => {
      try {
        let result = await vault.importWallet(null, pin, bufView);
      } catch (e) {
        expect(e.message).toBe(
          "Cannot read properties of null (reading 'startsWith')"
        );
      }
    });

    test("importWallet/empty pin", async () => {
      let result = await vault.importWallet(impprivatekey, null, bufView);
      expect(result.error).toBe("Wrong pin type, format or length");
    });
    test("importWallet/incorrect pin", async () => {
      let result = await vault.importWallet(impprivatekey, "111111", bufView);
      expect(result.error).toBe("Incorrect pin");
    });
    test("importWallet/empty encryption key", async () => {
      let result = await vault.importWallet(impprivatekey, pin, null);
      expect(result.error).toBe("Incorrect Encryption Key or vault string");
    });

    test("importWallet/empty all params", async () => {
      let result = await vault.importWallet(null, null, null);
      expect(result.error).toBe("Wrong pin type, format or length");
    });
  });
});

describe("getActiveChains", () => {
  test("getActiveChains", async () => {
    let result = await vault.getActiveChains();
    chains = result.response;
    expect({
      response: [
        { chain: "bitcoin", symbol: "BTC" },
        { chain: "stacks", symbol: "STX" },
        { chain: "solana", symbol: "SOL" },
        { chain: "ethereum", symbol: "ETH" },
        { chain: "bsc", symbol: "BSC" },
        { chain: "polygon", symbol: "MATIC" },
        { chain: "optimism", symbol: "OP" },
        { chain: "arbitrum", symbol: "ARB" },
        { chain: "mantle", symbol: "MNT" },
        { chain: "velas", symbol: "VLX" },
        { chain: "avalanche", symbol: "AVAX" },
        { chain: "base", symbol: "BASE" },
        { chain: "zkEVM", symbol: "ZKEVM" },
        { chain: "bevm", symbol: "BTC" },
        { chain: "rootstock", symbol: "RBTC" },
      ],
    }).toMatchObject(result);
  });
});

describe("deleteAccount", () => {
  test("deleteAccount/valid generated acc", async () => {
    let result = await vault.deleteAccount(bufView, accAddress, pin);

    expect(result).toHaveProperty("response");
  });

  test("deleteAccount/valid imported acc", async () => {
    let result = await vault.deleteAccount(bufView, impAccAddress, pin);
    expect(result).toHaveProperty("response");
  });

  test("deleteAccount/empty encryption key", async () => {
    try {
      let result = await vault.deleteAccount(null, accAddress, pin);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });

  test("deleteAccount/invalid encryption key", async () => {
    try {
      let result = await vault.deleteAccount(null, accAddress, pin);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });
  test("deleteAccount/empty address", async () => {
    let result = await vault.deleteAccount(bufView, null, "696969");
    expect(result.error).toBe("This address is not present in the vault");
  });
  test("deleteAccount/invalid address", async () => {
    let result = await vault.deleteAccount(bufView, "rerwgtehry", "696969");
    expect(result.error).toBe("This address is not present in the vault");
  });
  test("deleteAccount/empty pin", async () => {
    let result = await vault.deleteAccount(bufView, accAddress, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("deleteAccount/invalid pin", async () => {
    let result = await vault.deleteAccount(bufView, accAddress, "efwe");
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("deleteAccount/incorrect pin", async () => {
    let result = await vault.deleteAccount(bufView, accAddress, "111111");
    expect(result.error).toBe("Incorrect pin");
  });
  test("deleteAccount/all params empty", async () => {
    try {
      let result = await vault.deleteAccount(null, null, null);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
});

describe("restoreAccount", () => {
  test("restoreAccount/valid generated acc", async () => {
    let result = await vault.restoreAccount(bufView, accAddress, pin);
    expect(result).toHaveProperty("response");
  });

  test("restoreAccount/valid imported acc", async () => {
    let result = await vault.restoreAccount(bufView, impAccAddress, pin);
    expect(result).toHaveProperty("response");
  });

  test("restoreAccount/empty encryption key", async () => {
    try {
      let result = await vault.restoreAccount(null, accAddress, pin);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });

  test("restoreAccount/invalid encryption key", async () => {
    try {
      let result = await vault.restoreAccount(null, accAddress, pin);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });
  test("restoreAccount/empty address", async () => {
    let result = await vault.restoreAccount(bufView, null, pin);
    expect(result.error).toBe("This address is not present in the vault");
  });
  test("restoreAccount/invalid address", async () => {
    let result = await vault.restoreAccount(bufView, "rerwgtehry", pin);
    expect(result.error).toBe("This address is not present in the vault");
  });
  test("restoreAccount/empty pin", async () => {
    try {
      let result = await vault.restoreAccount(bufView, accAddress, null);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
  test("restoreAccount/invalid pin", async () => {
    try {
      let result = await vault.restoreAccount(bufView, accAddress, "efwe");
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
  test("restoreAccount/incorrect pin", async () => {
    let result = await vault.restoreAccount(bufView, accAddress, "111111");
    expect(result.error).toBe("Incorrect pin");
  });
  test("restoreAccount/all params empty", async () => {
    try {
      let result = await vault.restoreAccount(null, null, null);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
});

describe("restoreKeyringState", () => {
  test("restoreKeyringState/valid", async () => {
    await vault.restoreKeyringState(vaultAddress, pin, bufView);
    expect(result).toHaveProperty("response");
  });

  test("restoreKeyringState/empty vault address", async () => {
    try {
      let result = await vault.restoreKeyringState(null, pin, bufView);
    } catch (e) {
      expect(e.message).toBe("Cannot read properties of null (reading 'salt')");
    }
  });

  test("restoreKeyringState/invalid vault address", async () => {
    let result = await vault.restoreKeyringState("abc", pin, bufView);
    expect(result.error).toBe("Incorrect Encryption Key or vault string");
  });

  test("restoreKeyringState/empty pin", async () => {
    let result = await vault.restoreKeyringState(vaultAddress, null, bufView);
    expect(result.error).toBe("Wrong pin type, format or length");
  });

  test("restoreKeyringState/invalid pin", async () => {
    let result = await vault.restoreKeyringState(
      vaultAddress,
      "avevr",
      bufView
    );
    expect(result.error).toBe("Wrong pin type, format or length");
  });

  test("restoreKeyringState/empty encrption key", async () => {
    let result = await vault.restoreKeyringState(vaultAddress, pin, null);
    expect(result.error).toBe("Incorrect Encryption Key or vault string");
  });

  test("restoreKeyringState/invalid encrption key", async () => {
    let result = await vault.restoreKeyringState(vaultAddress, pin, "weefew");
    expect(result.error).toBe("Incorrect Encryption Key or vault string");
  });

  test("restoreKeyringState/all params empty", async () => {
    let result = await vault.restoreKeyringState(null, null, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
});

describe("getVaultDetails", () => {
  test("getVaultDetails/valid", async () => {
    let result = await vault.getVaultDetails(bufView);
    expect(result.response).toHaveProperty("evm");
  });

  test("getVaultDetails/empty encryption key", async () => {
    let result = await vault.getVaultDetails(null);
    expect(result.error).toBe("Incorrect Encryption Key or vault string");
  });

  test("getVaultDetails/invalid encryption key", async () => {
    let result = await vault.getVaultDetails("adfaefae");
    expect(result.error).toBe("Incorrect Encryption Key or vault string");
  });
});

describe("getBalance", () => {
  test("getBalance/valid", async () => {
    let result = await vault.getBalance(accAddress, polygonRpcUrl);
    expect(result.response).toHaveProperty("balance");
  });

  test("getBalance/empty address", async () => {
    try {
      let result = await vault.getBalance(null, ethUrl);
    } catch (e) {
      expect(e.message).toBe(
        "Provided address null is invalid, the capitalization checksum test failed, or it's an indirect IBAN address which can't be converted."
      );
    }
  });

  test("getBalance/invalid address", async () => {
    let addr = "fghioiuhgf";
    try {
      let result = await vault.getBalance("fghioiuhgf", ethUrl);
    } catch (e) {
      expect(e.message).toBe(
        `Provided address ${addr} is invalid, the capitalization checksum test failed, or it's an indirect IBAN address which can't be converted.`
      );
    }
  });

  test("getBalance/empty url", async () => {
    try {
      let result = await vault.getBalance(accAddress, null);
    } catch (e) {
      expect(e.message).toBe(
        `CONNECTION ERROR: Couldn't connect to node http://localhost:8545.`
      );
    }
  });
  test("getBalance/invalid url", async () => {
    let url = "https.11.com";
    try {
      let result = await vault.getBalance(accAddress, url);
    } catch (e) {
      expect(e.message).toBe(
        `CONNECTION ERROR: Couldn't connect to node ${url}.`
      );
    }
  });
});

describe("updateLabel", () => {
  const addresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  addresses.forEach((address, index) => {
    test(`updateLabel/valid  using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      await vault.importWallet("0x" + privateKeyImp, pin, bufView);
      let result = await vault.updateLabel(
        address.toLowerCase(),
        bufView,
        "Wallet 1"
      );
      expect(result).toHaveProperty("response");
    });

    test(`updateLabel/invalid address using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      let result = await vault.updateLabel("adeded", bufView, "Wallet 1");
      expect(result.error).toBe("This address is not present in the vault");
    });

    test(`updateLabel/empty address using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      let result = await vault.updateLabel(null, bufView, "Wallet 1");
      expect(result.error).toBe("This address is not present in the vault");
    });
    test(`updateLabel/invalid encryption key using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      let result = await vault.updateLabel(
        address.toLowerCase(),
        "afers",
        "Wallet 1"
      );
      expect(result.error).toBe("Incorrect Encryption Key or vault string");
    });
    test(`updateLabel/empty encryption key using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      let result = await vault.updateLabel(
        address.toLowerCase(),
        null,
        "Wallet 1"
      );
      expect(result.error).toBe("Incorrect Encryption Key or vault string");
    });
    test(`updateLabel/empty label using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      try {
        let result = await vault.updateLabel(
          address.toLowerCase(),
          bufView,
          null
        );
      } catch (e) {
        expect(e.message).toBe("chainName is not defined");
      }
    });
    test(`updateLabel/all empty params using ${
      index == 1 ? "imported" : ""
    } address ${address}`, async () => {
      let result = await vault.updateLabel(null, null, null);
      expect(result.error).toBe("Incorrect Encryption Key or vault string");
    });
  });
});

describe("sign", () => {
  const evmaddresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  const bitcoinadresses = [
    process.env.BITCOIN_ADDRESS_1,
    process.env.BITCOIN_ADDRESS_2,
  ];
  Object.keys(NETWORKS)
    .filter((key) => key !== "bitcoin")
    .forEach((chainName) => {
      const networkConfig = getNetworkConfig(chainName);

      let addresses;
      let impprivatekey;
      if (chainName == "bitcoin") {
        addresses = bitcoinadresses;
        impprivatekey = privateKeybtcImp;
      } else {
        addresses = evmaddresses;
        impprivatekey = "0x" + privateKeyImp;
      }
      addresses.forEach((address, index) => {
        test(`sign/valid  for ${chainName} using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          vault.changeNetwork(chainName);
          await vault.importWallet(impprivatekey, pin, bufView);

          console.log("sign/valid--->", pin, networkConfig.url);
          await vault.restoreKeyringState(vault, pin, bufView);

          let result = await vault.sign(
            data,
            address.toLowerCase(),
            pin,
            networkConfig.url
          );
          console.log("sign/valid--->", result);
          expect(result.response).toHaveProperty("signature");
        });

        test(`sign/empty data  for ${chainName}  using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          let result = await vault.sign(
            "",
            address.toLowerCase(),
            pin,
            networkConfig.url
          );
          expect(result.response).toHaveProperty("signature");
        });

        test(`sign/empty address  for ${chainName}  using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          try {
            let result = await vault.sign(data, null, pin, networkConfig.url);
          } catch (e) {
            expect(e.message).toBe(
              "Cannot read properties of null (reading 'toLowerCase')"
            );
          }
        });
        test(`sign/invalid address using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          try {
            let result = await vault.sign(data, "abc", pin, networkConfig.url);
          } catch (e) {
            expect(e.message).toBe(
              'Given address "abc" is not a valid Ethereum address.'
            );
          }
        });
        test(`sign/empty pin  for ${chainName}  using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";

          let result = await vault.sign(data, "abc", null, networkConfig.url);
          expect(result.error).toBe("Wrong pin type, format or length");
        });
        test(`sign/incorrect  for ${chainName}  pin using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";

          let result = await vault.sign(
            data,
            "abc",
            "111111",
            networkConfig.url
          );
          expect(result.error).toBe("Incorrect pin");
        });
        test(`sign/invalid  for ${chainName}  pin using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          let result = await vault.sign(
            data,
            accAddress,
            "abc",
            networkConfig.url
          );
          expect(result.error).toBe("Wrong pin type, format or length");
        });

        test(`sign/empty for ${chainName}  url using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          let result = await vault.sign(data, address.toLowerCase(), pin, null);
          expect(result.response).toHaveProperty("signature");
        });

        test(`sign/invalid url for ${chainName}  using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";
          let result = await vault.sign(
            data,
            address.toLowerCase(),
            pin,
            "abc"
          );
          expect(result.response).toHaveProperty("signature");
        });

        test(`sign/all params empty for ${chainName}  using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let data = "hello world";

          let result = await vault.sign(null, null, null, null);
          expect(result.error).toBe("Wrong pin type, format or length");
        });
      });
    });
});

describe("sign message", () => {
  const evmaddresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  const bitcoinadresses = [
    process.env.BITCOIN_ADDRESS_1,
    process.env.BITCOIN_ADDRESS_2,
  ];
  Object.keys(NETWORKS).forEach(async (chainName) => {
    const networkConfig = getNetworkConfig(chainName);

    let addresses;
    let impprivatekey;
    if (chainName == "bitcoin") {
      addresses = bitcoinadresses;
      impprivatekey = privateKeybtcImp;
    } else {
      addresses = evmaddresses;
      impprivatekey = "0x" + privateKeyImp;
    }
    addresses.forEach((address, index) => {
      test(`signMessage for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        vault.changeNetwork(chainName);
        await vault.importWallet(impprivatekey, pin, bufView);

        const message = `Hello, eth!`;
        let web3 = new Web3(networkConfig.url);
        const hash = crypto.createHash("sha256").update(message).digest();
        const hexData = web3.utils.toHex(hash);

        const msgParams = {
          from: address,
          data: hexData,
        };

        const raw_sign = await vault.signMessage(
          address,
          msgParams.data,
          pin,
          bufView,
          ethUrl
        );
        console.log(raw_sign);
      });

      // Skip signTypedMessage and personalSign tests for Bitcoin
      if (chainName !== "bitcoin") {
        test(`signTypeMessage for ${chainName} using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          let msgParams = {
            from: address,
            data: {
              types: {
                EIP712Domain: [
                  { name: "name", type: "string" },
                  { name: "version", type: "string" },
                  { name: "chainId", type: "uint256" },
                  { name: "verifyingContract", type: "address" },
                ],
                Person: [
                  { name: "name", type: "string" },
                  { name: "wallet", type: "address" },
                ],
                Mail: [
                  { name: "from", type: "Person" },
                  { name: "to", type: "Person" },
                  { name: "contents", type: "string" },
                ],
              },
              primaryType: "Mail",
              domain: {
                name: "Ether Mail",
                version: "1",
                chainId: NETWORKS[chainName].CHAIN_ID,
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
              },
              message: {
                from: {
                  name: "Cow",
                  wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
                },
                to: {
                  name: "Bob",
                  wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
                },
                contents: "Hello, Bob!",
              },
            },
          };

          const rawSignature = await vault.signTypedMessage(
            address,
            msgParams.data,
            pin,
            bufView,
            networkConfig.url
          );
          console.log("Raw signature:", rawSignature);

          // Verify the signature
          msgParams = { ...msgParams.data, from: msgParams.from };
          const recoveredAddress = sigUtil.recoverTypedSignature({
            data: msgParams,
            sig: rawSignature.response,
          });

          const isSignatureValid =
            recoveredAddress.toLowerCase() === msgParams.from.toLowerCase();

          assert(
            isSignatureValid,
            `Signature verification failed for ${chainName} using address ${address}`
          );
          assert(
            rawSignature,
            `Failed to Sign Message for ${chainName} using address ${address}`
          );
        });

        test(`personalSign for ${chainName} using ${
          index == 1 ? "imported" : ""
        } address ${address}`, async () => {
          const message = "Hello, personal sign!";
          const msgParams = {
            from: address,
            data: message,
          };

          const rawSignature = await vault.personalSign(
            address,
            msgParams.data,
            pin,
            bufView,
            networkConfig.url
          );

          console.log("Raw signature:", rawSignature);

          // Verify the signature
          let web3 = new Web3(networkConfig.url);
          const recoveredAddress = web3.eth.accounts.recover(
            message,
            rawSignature.response
          );

          const isSignatureValid =
            recoveredAddress.toLowerCase() === address.toLowerCase();

          assert(
            isSignatureValid,
            `Signature verification failed for ${chainName} using address ${address}`
          );

          assert(
            rawSignature,
            `Failed to Personal Sign Message for ${chainName} using address ${address}`
          );
        });
      }
    });
  });
});

describe("signTransaction", () => {
  const evmaddresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  const bitcoinadresses = [
    process.env.BITCOIN_ADDRESS_1,
    process.env.BITCOIN_ADDRESS_2,
  ];
  Object.keys(NETWORKS).forEach((chainName) => {
    const networkConfig = getNetworkConfig(chainName);

    let addresses;
    let impprivatekey;
    if (chainName == "bitcoin") {
      addresses = bitcoinadresses;
      impprivatekey = privateKeybtcImp;
    } else {
      addresses = evmaddresses;
      impprivatekey = "0x" + privateKeyImp;
    }
    addresses.forEach((address, index) => {
      test(`signTransaction/valid for ${chainName} using ${
        index === 1 ? "imported" : ""
      } address ${address}`, async () => {
        vault.changeNetwork(chainName);
        const web3 = new Web3(networkConfig.url);
        await vault.importWallet(impprivatekey, pin, bufView);

        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };
        await vault.getActiveChains();
        try {
          let result = await vault.signTransaction(
            rawTx,
            pin,
            networkConfig.url
          );

          // Add more specific assertions based on the expected result structure
        } catch (e) {
          expect(e.message).toBe("Cannot read property 'salt' of undefined");
        }
      });

      test(`signTransaction/empty raw tx for ${chainName} using ${
        index === 1 ? "imported" : ""
      }
       address ${address}`, async () => {
        let from = process.env.EVM_ADDRESS_1;
        const web3 = new Web3(networkConfig.url);
        try {
          let result = await vault.signTransaction({}, pin, networkConfig.url);
        } catch (e) {
          expect(e.message).toBe(
            "Cannot read properties of undefined (reading 'toLowerCase')"
          );
        }
      });

      test(`signTransaction/invalid raw for ${chainName} using ${
        index === 1 ? "imported" : ""
      } address ${address}`, async () => {
        try {
          let result = await vault.signTransaction(
            "invalid",
            pin,
            networkConfig.url
          );
        } catch (e) {
          expect(e.message).toBe(
            "Cannot read properties of undefined (reading 'toLowerCase')"
          );
        }
      });

      test(`signTransaction/empty pin for ${chainName} using ${
        index === 1 ? "imported" : ""
      } address ${address}`, async () => {
        const web3 = new Web3(networkConfig.url);
        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };

        let result = await vault.signTransaction(
          rawTx,
          null,
          networkConfig.url
        );
        expect(result.error).toBe("Wrong pin type, format or length");
      });

      test(`signTransaction/invalid pin for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        let from = address.toLowerCase();
        const web3 = new Web3(networkConfig.url);

        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };

        let result = await vault.signTransaction(
          "evwf",
          "afewf",
          networkConfig.url
        );
        expect(result.error).toBe("Wrong pin type, format or length");
      });
      test(`signTransaction/incorrect pin for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        let from = address.toLowerCase();
        const web3 = new Web3(networkConfig.url);

        const rawTx = {
          to: "0xacde0f575d8caf7bdba417326797c1a1d1b21f88", //recepient address
          from: from.toLowerCase(), //sender address
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000), //method to compute gas provided below
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          data: "0x0", // method to generate data is provided below

          type: "0x2",
        };

        let result = await vault.signTransaction(
          "evwf",
          "112344",
          networkConfig.url
        );
        expect(result.error).toBe("Incorrect pin");
      });

      test(`signTransaction/empty polygon rpc for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        let from = address.toLowerCase();
        const web3 = new Web3(networkConfig.url);

        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };

        try {
          let result = await vault.signTransaction(rawTx, pin, null);
        } catch (e) {
          expect(e.message).toBe(
            "CONNECTION ERROR: Couldn't connect to node http://localhost:8545."
          );
        }
      });

      test(`signTransaction/invalid polygon rpc for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        let from = address.toLowerCase();
        const web3 = new Web3(networkConfig.url);

        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };
        let invalidRpc = "efrwgrwdvfr";
        try {
          let result = await vault.signTransaction(rawTx, pin, invalidRpc);
        } catch (e) {
          expect(e.message).toBe(
            `CONNECTION ERROR: Couldn't connect to node ${invalidRpc}.`
          );
        }
      });

      test(`signTransaction/all empty params for ${chainName} using ${
        index == 1 ? "imported" : ""
      } address ${address}`, async () => {
        let from = address.toLowerCase();
        const web3 = new Web3(networkConfig.url);

        const rawTx = {
          to: addresses[index === 0 ? 1 : 0],
          from: address.toLowerCase(),
          value: web3.utils.numberToHex(web3.utils.toWei("0.001", "ether")),
          gasLimit: web3.utils.numberToHex(21000),
          maxPriorityFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("42.25770", "gwei"))
          ),
          maxFeePerGas: web3.utils.numberToHex(
            parseFloat(web3.utils.toWei("150.99", "gwei"))
          ),
          amount: 0,
          satPerByte: 1,
          data: "0x0",
          type: "0x2",
        };
        let invalidRpc = "efrwgrwdvfr";

        let result = await vault.signTransaction(null, null, null);
        expect(result.error).toBe("Wrong pin type, format or length");
      });
    });
  });
});

describe("validateMnemonic", () => {
  let signUpPhrase =
    "join danger verb slide lava blossom garment school panel shaft damp ghost";
  test("validateMnemonic/valid", async () => {
    let result = await vault.validateMnemonic(
      signUpPhrase,
      "polygonamoytest",
      "mainnet",
      polygonRpcUrl
    );
    expect(result.response).toBe(true);
  });
  test("validateMnemonic/empty phrase", async () => {
    let result = await vault.validateMnemonic(
      "",
      "abhi141",
      "testnet",
      polygonRpcUrl
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/invalid phrase", async () => {
    let result = await vault.validateMnemonic(
      "waefsgrth",
      "abhi141",
      "testnet",
      polygonRpcUrl
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/empty safle id", async () => {
    let result = await vault.validateMnemonic(
      signUpPhrase,
      null,
      "testnet",
      polygonRpcUrl
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/invalid safle id", async () => {
    let result = await vault.validateMnemonic(
      signUpPhrase,
      "egsrrgr",
      "testnet",
      polygonRpcUrl
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/empty network", async () => {
    try {
      let result = await vault.validateMnemonic(
        signUpPhrase,
        "abhi141",
        null,
        polygonRpcUrl
      );
    } catch (e) {
      expect(e).toBe("Invalid network selected");
    }
  });
  test("validateMnemonic/invalid network", async () => {
    try {
      let result = await vault.validateMnemonic(
        signUpPhrase,
        "abhi141",
        "segsr",
        polygonRpcUrl
      );
    } catch (e) {
      expect(e).toBe("Invalid network selected");
    }
  });
  test("validateMnemonic/invalid network", async () => {
    try {
      let result = await vault.validateMnemonic(
        signUpPhrase,
        "abhi141",
        "segsr",
        polygonRpcUrl
      );
    } catch (e) {
      expect(e).toBe("Invalid network selected");
    }
  });
  test("validateMnemonic/invalid url", async () => {
    let result = await vault.validateMnemonic(
      signUpPhrase,
      "abhi141",
      "testnet",
      "awfe"
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/empty url", async () => {
    let result = await vault.validateMnemonic(
      signUpPhrase,
      "abhi141",
      "testnet",
      null
    );
    expect(result.response).toBe(false);
  });
  test("validateMnemonic/all empty params", async () => {
    try {
      let result = await vault.validateMnemonic(null, null, null, null);
    } catch (e) {
      expect(e).toBe("Invalid network selected");
    }
  });
});

describe("changePin", () => {
  test("changePin/valid", async () => {
    let result = await vault.changePin(pin, pin, bufView);
    expect(result).toHaveProperty("response");
  });

  test("changePin/wrong currentpin", async () => {
    try {
      let result = await vault.changePin("111111", pin, bufView);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("changePin/invalid currentpin", async () => {
    try {
      let result = await vault.changePin("aefe", pin, bufView);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
  test("changePin/empty currentpin", async () => {
    try {
      let result = await vault.changePin(null, pin, bufView);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("changePin/empty new pin", async () => {
    try {
      let result = await vault.changePin(pin, null, bufView);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("changePin/invalid new pin", async () => {
    try {
      let result = await vault.changePin(pin, "afaef", bufView);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });

  test("changePin/empty encryption key", async () => {
    try {
      let result = await vault.changePin(pin, pin, null);
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });

  test("changePin/invalid encryption key", async () => {
    try {
      let result = await vault.changePin(pin, pin, "efefe");
    } catch (e) {
      expect(e.message).toBe("Incorrect Encryption Key or vault string");
    }
  });
  test("changePin/all empty params", async () => {
    try {
      let result = await vault.changePin(null, null, null);
    } catch (e) {
      expect(e).toBe("Wrong pin type, format or length");
    }
  });
});

describe("getLogs", () => {
  test("getLogs/valid", async () => {
    let result = await vault.getLogs();
    expect(result).toHaveProperty("logs");
  });
});

describe("getAccounts", () => {
  test("getAccounts/valid", async () => {
    await vault.restoreKeyringState(vaultAddress, pin, bufView);
    let result = await vault.getAccounts();
    expect(result).toHaveProperty("response");
  });
});

describe("Add new network", () => {
  test("Add network", async () => {
    await vault.addNetwork("TestChain", { symbol: "TST", txType: 0 });
    let chainInfo = await vault.getChainInfo("TestChain");
    console.log(chainInfo);
    expect(chainInfo.symbol).toBe("TST");
  });
});

describe("getFees", () => {
  const evmAddresses = [process.env.EVM_ADDRESS_1, process.env.EVM_ADDRESS_2];
  const bitcoinAddresses = [
    process.env.BITCOIN_ADDRESS_1,
    process.env.BITCOIN_ADDRESS_2,
  ];

  Object.keys(NETWORKS).forEach((chainName) => {
    const networkConfig = getNetworkConfig(chainName);

    let addresses;
    if (chainName === "bitcoin") {
      addresses = bitcoinAddresses;
    } else {
      addresses = evmAddresses;
    }

    addresses.forEach((address, index) => {
      test(`getFees/valid for ${chainName} using address ${address}`, async () => {
        vault.changeNetwork(chainName);
        const web3 =
          chainName !== "bitcoin" ? new Web3(networkConfig.url) : null;

        const rawTx =
          chainName === "bitcoin"
            ? {
                to: addresses[index === 0 ? 1 : 0],
                from: address,
                value: "0.0001", // BTC value
              }
            : {
                to: addresses[index === 0 ? 1 : 0],
                from: address.toLowerCase(),
                value: web3.utils.numberToHex(web3.utils.toWei("0", "ether")),
                chainID: networkConfig.chainId,
              };

        let result = await vault.getFees(rawTx, networkConfig.url);

        if (chainName === "bitcoin") {
          expect(result.response).toHaveProperty("transactionSize");
          expect(result.response).toHaveProperty("fees");
          expect(result.response.fees).toHaveProperty("slow");
          expect(result.response.fees).toHaveProperty("standard");
          expect(result.response.fees).toHaveProperty("fast");
          expect(result.response.fees.slow).toHaveProperty("satPerByte");
          expect(result.response.fees.standard).toHaveProperty("satPerByte");
          expect(result.response.fees.fast).toHaveProperty("satPerByte");
          expect(typeof result.response.transactionSize).toBe("number");
          expect(typeof result.response.fees.slow.satPerByte).toBe("number");
          expect(typeof result.response.fees.standard.satPerByte).toBe(
            "number"
          );
          expect(typeof result.response.fees.fast.satPerByte).toBe("number");
        } else {
          expect(result.response).toHaveProperty("gasLimit");
          expect(result.response).toHaveProperty("fees");
          if (networkConfig.txType === 2) {
            expect(result.response.fees.fast).toHaveProperty("maxFeePerGas");
            expect(result.response.fees.fast).toHaveProperty(
              "maxPriorityFeePerGas"
            );
          } else {
            expect(result.response.fees.fast).toHaveProperty("gasPrice");
          }
        }
      });

      test(`getFees/network error for ${chainName} using address ${address}`, async () => {
        // Mock axios to simulate a network error

        const rawTx =
          chainName === "bitcoin"
            ? { from: address }
            : { from: address.toLowerCase() };

        try {
          let result = await vault.getFees(rawTx, "invalid_url");
        } catch (e) {
          expect(e.message).toBe(
            "CONNECTION ERROR: Couldn't connect to node invalid_url."
          );
        }
      });
    });
  });
});
