import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useNativeCurrencyBalance from "../hooks/useNativeCurrencyBalance";
import { parseBalance } from "../util";
import useEthPrice from "../hooks/useEthPrice";
import { LIB_TOKEN_ADDRESS } from "../constants";
import useTokenContract from "../hooks/useTokenContract";
import { useEffect, useState } from "react";
import { formatEther } from "@ethersproject/units";

const NativeCurrencyBalance = () => {
  const { account } = useWeb3React<Web3Provider>();
  const { data } = useNativeCurrencyBalance(account);
  const libToken = useTokenContract(LIB_TOKEN_ADDRESS);
  const ethPrice = useEthPrice();
  const [libBalance, setLibBalance] = useState<any>();

  const crypto = parseBalance(data ?? 0);
  const real = Number(crypto) * ethPrice;

  const getLibBalance = async () => {
    const balance = await libToken.balanceOf(account);
    setLibBalance(formatEther(balance));
  };

  useEffect(() => {
    getLibBalance();
  }, []);

  return (
    <>
      <p>Balance: ETH {crypto}</p>
      <p>LIB {libBalance}</p>
      <p>USD: {real.toFixed(3)}</p>
    </>
  );
};

export default NativeCurrencyBalance;
