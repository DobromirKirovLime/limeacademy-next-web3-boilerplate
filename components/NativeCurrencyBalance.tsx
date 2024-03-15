import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useNativeCurrencyBalance from "../hooks/useNativeCurrencyBalance";
import { parseBalance } from "../util";
import useEthPrice from "../hooks/useEthPrice";

const NativeCurrencyBalance = () => {
  const { account } = useWeb3React<Web3Provider>();
  const { data } = useNativeCurrencyBalance(account);
  const ethPrice = useEthPrice();

  const crypto = parseBalance(data ?? 0);
  const real = Number(crypto) * ethPrice;

  return (
    <>
      <p>Balance: Ξ{crypto}</p>
      <p>USD: {real.toFixed(3)}</p>
    </>
  );
};

export default NativeCurrencyBalance;
