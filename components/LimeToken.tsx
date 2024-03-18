import React, { useEffect, useState } from "react";
import useLimeToken from "../hooks/useLimeToken";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers";

interface LimeTokenProps {
  contractAddress: any;
}

const LimeToken = ({ contractAddress }: LimeTokenProps) => {
  const { account } = useWeb3React<Web3Provider>();
  const limeToken = useLimeToken(contractAddress);
  const [balance, setBalance] = useState<string>("");

  const getBalance = async () => {
    const balanceTx = await limeToken.balanceOf(account);
    setBalance(ethers.utils.formatEther(balanceTx));
  };

  useEffect(() => {
    getBalance();
  }, [])

  return (
    <div>
      LimeToken balance: {balance} LMT
    </div>
  );
};

export default LimeToken;
