const ethereum = require("@getsafle/vault-eth-controller");
const bsc = require("@getsafle/vault-bsc-controller");
const polygon = require("@getsafle/vault-polygon-controller");
const bitcoin = require("@getsafle/vault-bitcoin-controller");
const optimism = require("@getsafle/vault-optimism-controller");
const arbitrum = require("@getsafle/vault-arbitrum-controller");
const mantle = require("@getsafle/vault-mantle-controller");
const velas = require("@getsafle/vault-velas-controller");
const avalanche = require("@getsafle/vault-avalanche-controller");
const base = require("@getsafle/vault-base-controller");
const zkEVM = require("@getsafle/vault-polygon-zkevm-controller");
const stacks = require("@getsafle/vault-stacks-controller");
const solana = require("@getsafle/vault-sol-controller");
const bevm = require("@getsafle/vault-bevm-controller");
const rootstock = require("@getsafle/vault-rootstock-controller");

const evmChains = {
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
};
const nonEvmChains = { bitcoin: "BTC", stacks: "STX", solana: "SOL" };

module.exports = {
  ethereum,
  bsc,
  polygon,
  bitcoin,
  optimism,
  arbitrum,
  mantle,
  velas,
  avalanche,
  base,
  zkEVM,
  stacks,
  solana,
  bevm,
  rootstock,
  evmChains,
  nonEvmChains,
};
