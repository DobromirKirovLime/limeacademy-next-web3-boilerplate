import React, { useState } from "react";
import Input from "./Input";
import LoadingSpinner from "./LoadingSpinner";
import { parseEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import useLibraryContract from "../hooks/useLibraryContract";
import useTokenContract from "../hooks/useTokenContract";
import { LIB_TOKEN_ADDRESS } from "../constants";

interface LibraryTokenProps {
  contractAddress: string;
}

const LibraryToken = ({ contractAddress }: LibraryTokenProps) => {
  const { account } = useWeb3React();
  const libContract = useLibraryContract(contractAddress);
  const libToken = useTokenContract(LIB_TOKEN_ADDRESS);
  const [amount, setAmount] = useState("");
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    const inputValue = e.currentTarget.value;
    setAmount(inputValue);
  };

  const handleEthToLib = async () => {
    setLoading(true);
    try {
      const wrapTx = await libContract.wrap({
        value: parseEther(amount),
      });
      setPendingTransactionHash(wrapTx.hash);
      await wrapTx.wait();
      setAmount("");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  const handleLibToEth = async () => {
    setLoading(true);
    try {
      const allowanceTx = await libToken.allowance(account, contractAddress);

      const needsApproval =
        Number(allowanceTx.toString()) -
          Number(parseEther(amount).toString()) <=
        0;

      if (needsApproval) {
        const approveTx = await libToken.approve(
          contractAddress,
          500000000000000
        );
        await approveTx.wait();
      }

      const unwrapTx = await libContract.unwrap(parseEther(amount));
      setPendingTransactionHash(unwrapTx.hash);
      await unwrapTx.wait();
      setAmount("");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  return (
    <div className="lib-token">
      <p>Transfer ETH to LIB 1:1</p>
      <Input
        id="amount"
        label="Amount in ETH "
        onChange={handleValueChange}
        value={amount}
      />
      <div className="button-wrapper">
        <button onClick={handleEthToLib} disabled={loading}>
          From ETH
        </button>
        <button onClick={handleLibToEth} disabled={loading}>
          To ETH
        </button>
      </div>
      {loading && (
        <div className="results-loading">
          <div>
            <div>Pending transaction</div>
            <LoadingSpinner />
          </div>
          <div>Transaction HASH: {pendingTransactionHash}</div>
          <a
            href={`https://sepolia.etherscan.io/tx/${pendingTransactionHash}`}
            target="_blank"
          >
            Etherscan URL
          </a>
        </div>
      )}
      {error && (
        <div className="results-error">
          {error?.error?.message || error?.message || "Unexpected error!"}
        </div>
      )}
    </div>
  );
};

export default LibraryToken;
