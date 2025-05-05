jest.setTimeout(30000);
const crypto = require("crypto");

let Vault = require("../vault");

require("dotenv").config();

const bufView = [
  48, 0, 236, 187, 187, 172, 177, 90, 255, 184, 9, 116, 142, 96, 197, 158, 87,
  35, 26, 101, 187, 30, 116, 138, 50, 131, 166, 50, 51, 197, 198, 83, 238, 167,
  105, 178, 182, 108, 174, 199, 124, 141, 155, 73, 21, 85, 81, 109, 78, 233,
  152, 108, 242, 238, 192, 31, 147, 86, 174, 195, 55, 229, 4, 36,
];
let oldphrase = process.env.OLD_MNEMONIC;
let phrase = process.env.MNEMONIC;

let pin = process.env.PIN;
let vault = new Vault({});
const logs = [
  {
    action: "add-account",
    timestamp: 1000000000001,
    platform: "web",
    address: "0xF8919220F674a553F0F0F6e86481612A2bEd44EB",
    storage: ["mobile"],
    _id: "64e881b05b04774ca85aee51",
  },
  {
    action: "add-account",
    timestamp: 1000000000002,
    platform: "web",
    address: "0x627437E29e7363C0F53896e84467EF6F8f9D0247",
    storage: ["mobile"],
    _id: "64e881e3bae0e048dfaefc46",
  },
  {
    action: "add-account",
    timestamp: 1000000000003,
    platform: "web",
    address: "0xa1F77e4D8306000639D1d44a6013ad53b992182E",
    storage: ["mobile"],
    _id: "64ec3339a58abcbf66a9b34a",
  },
  {
    action: "add-account",
    timestamp: 1000000000004,
    platform: "web",
    address: "0x9e6627384a3E6453b9EC061e4DaeD4cE0223bbdc",
    storage: ["mobile"],
    _id: "64ec333ca58abcbf66a9b354",
  },
  {
    action: "add-account",
    timestamp: 1000000000005,
    platform: "mobile",
    address: "0xCccbD31ea19acE5688731148a4f63907F273BEe0",
    storage: ["mobile"],
    _id: "64e87e9e72e00ccf96bce1fc",
  },
  {
    action: "delete-account",
    timestamp: 1000000000006,
    platform: "web",
    address: "0x9e6627384a3E6453b9EC061e4DaeD4cE0223bbdc",
    storage: ["mobile"],
    _id: "64ec3339a58abcbf66a9b34a",
  },
];
describe("getSupportedChains", () => {
  test("getSupportedChains", async () => {
    let result = await new Vault({}).getSupportedChains();
    expect({
      evmChains: {
        ethereum: "ETH",
        bsc: "BSC",
        polygon: "MATIC",
        optimism: "OP",
        arbitrum: "ARB",
        mantle: "MNT",
        velas: "VLX",
        avalanche: "AVAX",
        base: "BASE",
        zkEVM: "ZKEVM",
        bevm: "BTC",
        rootstock: "RBTC",
        opbnb: "BNB",
        sei: "SEI",
        ronin: "RON",
        nebula: "sFUEL",
        immutable: "IMX",
      },
      nonEvmChains: {
        bitcoin: "BTC",
        stacks: "STX",
        solana: "SOL",
        concordium: "CCD",
      },
    }).toMatchObject(result.response);
  });
});

describe("generateMnemonic", () => {
  test("generateMnemonic", async () => {
    let result = await new Vault({}).generateMnemonic();
    Mnemonic = result;
    expect(typeof result).toBe("string");
  });
});

describe("generateVault", () => {
  const buf = crypto.randomBytes(64);
  const bufView = [
    48, 0, 236, 187, 187, 172, 177, 90, 255, 184, 9, 116, 142, 96, 197, 158, 87,
    35, 26, 101, 187, 30, 116, 138, 50, 131, 166, 50, 51, 197, 198, 83, 238,
    167, 105, 178, 182, 108, 174, 199, 124, 141, 155, 73, 21, 85, 81, 109, 78,
    233, 152, 108, 242, 238, 192, 31, 147, 86, 174, 195, 55, 229, 4, 36,
  ];

  encrptionKey = bufView;
  test("generateVault/valid case", async () => {
    let result = await vault.generateVault(bufView, "111111", Mnemonic);
    expect(result).toHaveProperty("response");
  });

  test("generateVault/empty pin", async () => {
    const buf = new ArrayBuffer(32);
    const bufView = new Uint8Array(buf);

    let result = await new Vault({}).generateVault(bufView, null, Mnemonic);
    expect(result.error).toBe("Wrong pin type, format or length");
  });

  test("generateVault/empty encrption key", async () => {
    const buf = new ArrayBuffer(32);
    const bufView = new Uint8Array(buf);
    let result = await new Vault({}).generateVault(null, "1111", Mnemonic);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("generateVault/empty encrption key", async () => {
    const buf = new ArrayBuffer(32);
    const bufView = new Uint8Array(buf);
    let result = await new Vault({}).generateVault(null, "111111", Mnemonic);
    expect(result.error).toBe("Please enter both encryptionKey and pin");
  });

  test("generateVault/empty Mnemonic", async () => {
    const buf = new ArrayBuffer(32);
    const bufView = new Uint8Array(buf);
    try {
      let result = await new Vault({}).generateVault(bufView, 1111, null);
    } catch (e) {
      expect(e.message).toBe("Seed phrase is invalid.");
    }
  });

  test("generateVault/all empty params", async () => {
    const buf = new ArrayBuffer(32);
    const bufView = new Uint8Array(buf);

    let result = await new Vault({}).generateVault(null, null, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
});

describe("recoverVault", () => {
  test("recoverVault/transaction valid", async () => {
    let result = await vault.recoverVault(
      phrase,
      bufView,
      pin,
      "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
    );
    expect(result).toHaveProperty("response");
  });

  test("recoverVault/logs valid", async () => {
    let result = await vault.recoverVault(
      oldphrase,
      bufView,
      pin,
      null,
      "logs",
      logs
    );
    expect(result).toHaveProperty("response");
  });

  test("recoverVault/logs empty logs valid", async () => {
    let result = await vault.recoverVault(
      oldphrase,
      bufView,
      pin,
      null,
      "logs"
    );
    expect(result).toHaveProperty("response");
  });

  test("recoverVault/empty phrase", async () => {
    try {
      let result = await vault.recoverVault(
        null,
        bufView,
        pin,
        "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
      );
    } catch (e) {
      expect(e.message).toBe("Seed phrase is invalid.");
    }
  });

  test("recoverVault/invalid phrase", async () => {
    try {
      let result = await vault.recoverVault(
        "eafe",
        bufView,
        pin,
        "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
      );
    } catch (e) {
      expect(e.message).toBe("Seed phrase is invalid.");
    }
  });
  test("recoverVault/invalid phrase", async () => {
    try {
      let result = await vault.recoverVault(
        phrase,
        bufView,
        pin,
        "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
      );
    } catch (e) {
      expect(e.message).toBe("Seed phrase is invalid.");
    }
  });
  test("recoverVault/empty encryption key", async () => {
    let result = await vault.recoverVault(
      phrase,
      null,
      pin,
      "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
    );
    expect(result.error).toBe("Please enter both encryptionKey and pin");
  });
  test("recoverVault/invalid encryption key", async () => {
    let result = await vault.recoverVault(
      phrase,
      "fwefe",
      pin,
      "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
    );
    expect(result).toHaveProperty("response");
  });
  test("recoverVault/empty pin", async () => {
    let result = await vault.recoverVault(
      phrase,
      bufView,
      null,
      "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
    );
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("recoverVault/invalid pin", async () => {
    let result = await vault.recoverVault(
      phrase,
      bufView,
      "aefew",
      "BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD"
    );
    expect(result.error).toBe("Wrong pin type, format or length");
  });
  test("recoverVault/empty marshal key", async () => {
    let result = await vault.recoverVault(phrase, bufView, pin, null);
    expect(result.error).toBe("Invalid API key passed");
  });
  test("recoverVault/invalid marshal key", async () => {
    try {
      let result = await vault.recoverVault(phrase, bufView, pin, "efrwfrw");
    } catch (e) {
      expect(e.message).toBe(
        "Cannot destructure property 'transactions' of 'response' as it is undefined."
      );
    }
  });
  test("recoverVault/all empty params", async () => {
    let result = await vault.recoverVault(null, null, null, null);
    expect(result.error).toBe("Wrong pin type, format or length");
  });
});

// describe("Concordium Methods", () => {
//   let initializedVault;
//   const encryptionKey = bufView;
//   const validPin = "111111";
//   let mnemonic;

//   // Setup: Generate a vault to initialize the Concordium controller
//   beforeAll(async () => {
//     mnemonic = await new Vault({}).generateMnemonic();
//     initializedVault = new Vault({});
//     await initializedVault.generateVault(encryptionKey, validPin, mnemonic);
//   });

//   // describe("getIdentityProviders", () => {
//   //   test("should fetch identity providers successfully", async () => {
//   //     const result = await initializedVault.getIdentityProviders();
//   //     expect(Array.isArray(result)).toBe(true);
//   //     expect(result.length).toBeGreaterThan(0);
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(uninitializedVault.getIdentityProviders()).rejects.toThrow(
//   //       "Concordium controller not initialized"
//   //     );
//   //   });
//   // });

//   // describe("setIdentityProvider", () => {
//   //   test("should set identity provider successfully", async () => {
//   //     const providers = await initializedVault.getIdentityProviders();
//   //     await initializedVault.setIdentityProvider(providers[0]);
//   //     expect(providers).toBeDefined(); // Adjust based on actual return value from ConcordiumKeyringController
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(uninitializedVault.setIdentityProvider({})).rejects.toThrow(
//   //       "Concordium controller not initialized"
//   //     );
//   //   });
//   // });

//   // describe("createIdentityRequest", () => {
//   //   test("should create identity request successfully", async () => {
//   //     const result = await initializedVault.createIdentityRequest();
//   //     expect(result).toBeDefined();
//   //     expect(typeof result).toBe("object"); // Adjust based on expected output
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(uninitializedVault.createIdentityRequest()).rejects.toThrow(
//   //       "Concordium controller not initialized"
//   //     );
//   //   });
//   // });

//   // describe("sendIdentityRequest", () => {
//   //   test("should send identity request successfully", async () => {
//   //     const identityRequest = await initializedVault.createIdentityRequest();
//   //     const redirectUri = "http://localhost:4173/confirm-identity";
//   //     const result = await initializedVault.sendIdentityRequest(
//   //       identityRequest,
//   //       redirectUri
//   //     );
//   //     expect(typeof result).toBe("string"); // Expecting a URL
//   //     expect(result).toBeDefined();
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(
//   //       uninitializedVault.sendIdentityRequest({}, "")
//   //     ).rejects.toThrow("Concordium controller not initialized");
//   //   });
//   // });

//   // describe("retrieveIdentity", () => {
//   //   // Note: This test requires a valid redirect URL from a real identity verification flow
//   //   // For simplicity, we'll mock a scenario assuming a valid URL format
//   //   test("should retrieve identity with valid redirect URL", async () => {
//   //     // This is a placeholder test; actual implementation depends on Concordium's redirect flow
//   //     const redirectUrl =
//   //       "http://localhost:3000/confirm-identity?token=mockToken";
//   //     const result = await initializedVault.retrieveIdentity(redirectUrl);
//   //     expect(result).toBeDefined(); // Adjust based on expected output
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(uninitializedVault.retrieveIdentity("")).rejects.toThrow(
//   //       "Concordium controller not initialized"
//   //     );
//   //   });
//   // });

//   // describe("initializeIdentity", () => {
//   //   test("should initialize identity successfully", async () => {
//   //     // This assumes a mock identity object; in practice, you'd retrieve this from retrieveIdentity
//   //     const mockIdentity = { id: "mock-id" }; // Adjust based on actual identity structure
//   //     const result = await initializedVault.initializeIdentity(mockIdentity);
//   //     expect(result).toBeDefined(); // Adjust based on actual return value
//   //   });

//   //   test("should throw error if Concordium controller not initialized", async () => {
//   //     const uninitializedVault = new Vault({});
//   //     await expect(uninitializedVault.initializeIdentity({})).rejects.toThrow(
//   //       "Concordium controller not initialized"
//   //     );
//   //   });
//   // });
// });
