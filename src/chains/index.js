const EvmController = require("@getsafle/vault-evm-controller");
const bitcoin = require("@getsafle/vault-bitcoin-controller");
const stacks = require("@getsafle/vault-stacks-controller");
const solana = require("@getsafle/vault-sol-controller");
//we don't have to put rpc and chain id since our vault get web3 as a argument in all methods
const evmChains = {
  ethereum: { symbol: "ETH", txType: 2 },
  bsc: { symbol: "BSC", txType: 0 },
  polygon: { symbol: "MATIC", txType: 2 },
  optimism: { symbol: "OP", txType: 2 },
  arbitrum: { symbol: "ARB", txType: 2 },
  mantle: { symbol: "MNT", txType: 2 },
  velas: { symbol: "VLX", txType: 0 },
  avalanche: { symbol: "AVAX", txType: 2 },
  base: { symbol: "BASE", txType: 2 },
  zkEVM: { symbol: "ZKEVM", txType: 2 },
  bevm: { symbol: "BTC", txType: 0 },
  rootstock: { symbol: "RBTC", txType: 0 },
};

const nonEvmChains = {
  bitcoin: "BTC",
  stacks: "STX",
  solana: "SOL",
};

// Create an object with all EVM chains using the same controller but initialized with the appropriate txType
const evmControllers = Object.entries(evmChains).reduce(
  (acc, [chain, info]) => {
    acc[chain] = EvmController;
    return acc;
  },
  {}
);

// Create an object with just the symbols for EVM chains
const evmChainSymbols = Object.entries(evmChains).reduce(
  (acc, [chain, info]) => {
    acc[chain] = info.symbol;
    return acc;
  },
  {}
);

module.exports = {
  ...evmControllers,
  bitcoin,
  stacks,
  solana,
  evmChains: evmChainSymbols,
  nonEvmChains,
  getEvmChainInfo: (chain) => evmChains[chain],
  addEvmChain: (chainName, chainInfo) => {
    if (evmChains[chainName]) {
      throw new Error("Chain already exists");
    }
    evmChains[chainName] = chainInfo;
    evmControllers[chainName] = EvmController;

    evmChainSymbols[chainName] = chainInfo.symbol;
  },
};
