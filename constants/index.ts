export interface Networks {
  [key: number]: string;
}
export const walletConnectSupportedNetworks: Networks = {
  // Add your network rpc URL here
  1: "https://ethereumnode.defiterm.io",
  3: "https://ethereumnode.defiterm-dev.net",
  11155111: "https://sepolia.infura.io/v3/1e93d2b968b74b1e8eadf9d0ee4ba62e",
};

// Network chain ids
export const supportedMetamaskNetworks = [1, 3, 4, 5, 42, 11155111];

// Not sure why we need this
export const ALBT_TOKEN_ADDRESS = "0xc6869a93ef55e1d8ec8fdcda89c9d93616cf0a72";

// Current USElection address on Sepolia Testnet
//
// Contarct with ended election and a lot of data.
// export const US_ELECTION_ADDRESS = "0x15ee9144b505BeF220dd3105E51e292Bda7eD80B";
//
// Empty contract, ready to use.
export const US_ELECTION_ADDRESS = "0x11f86B655DEf9dEf1CFFa683c5629eB60B5ce305";

export const LIBRARY_ADDRESS = "0x8487cfb7E0F37eD820EB8a0030Fc395CEC588CA3";
