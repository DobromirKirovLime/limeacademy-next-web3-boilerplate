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

export const ALBT_TOKEN_ADDRESS = "0xc6869a93ef55e1d8ec8fdcda89c9d93616cf0a72";

export const US_ELECTION_ADDRESS = "0x11f86B655DEf9dEf1CFFa683c5629eB60B5ce305";

export const LIBRARY_ADDRESS = "0xbF70946C03B2BB3239e62ac3ABF0D172008A5fb7";

export const LIB_TOKEN_ADDRESS = "0x9FcD8B6e3c94fA4593ED53C50C2f13811E59C92A";

export const LMT_ADDRESS = "0xB9a2FF50cACaf948Fd0bdbFE8F3E7D0fDeA1bADF";

export const coinDeskApi = "https://production.api.coindesk.com/v2";
