import React, { useEffect, useState } from "react";
import Input from "./Input";
import LoadingSpinner from "./LoadingSpinner";
import { parseEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import useLibraryContract from "../hooks/useLibraryContract";
import useTokenContract from "../hooks/useLibTokenContract";
import { LIB_TOKEN_ADDRESS, SIGNED_MSG_ADDRESS_A } from "../constants";
import { utils } from "ethers";

interface LibraryTokenProps {
  contractAddress: string;
}

const LibraryToken = ({ contractAddress }: LibraryTokenProps) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const libContract = useLibraryContract(contractAddress);
  const libToken = useTokenContract(LIB_TOKEN_ADDRESS);
  const [amount, setAmount] = useState("");
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const getOwner = async () => {
    const getOwnerTx = await libContract.owner();
    setIsOwner(getOwnerTx === account);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    const inputValue = e.currentTarget.value;
    setAmount(inputValue);
  };

  /**
   * Converts ETH to LIB tokens
   */
  const handleEthToLib = async () => {
    setLoading(true);
    try {
      const wrapTx = await libContract.wrap({
        value: parseEther(amount),
      });
      console.log(wrapTx);
      setPendingTransactionHash(wrapTx.hash);
      const reciept = await wrapTx.wait();
      console.log(reciept);

      setAmount("");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  /**
   * Converts LIB tokes back to ETH
   */
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

  /**
   * This function returns all the LIB tokens thet were colected by the smart contract
   * and sends them to the owner address.
   */
  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const withdraw = await libContract.withdrawMoney();
      await withdraw.wait();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  /**
   * This function allows address (B) to make transactions on behalf of address (A).
   * For this the signed message from address (A) is needed.
   */
  const handleWrapTokenWithSignature = async () => {
    setLoading(true);

    const messageHash = utils.solidityKeccak256(
      ["string"],
      ["Yes, I signed the message"]
    );

    // Used for initial signing of the msg from  address (A)
    // const signer = library.getSigner();
    // const arrayfiedHash = utils.arrayify(messageHash);
    // const signedMessage = await signer.signMessage(arrayfiedHash);

    const signedMessage = SIGNED_MSG_ADDRESS_A;
    const sig = utils.splitSignature(signedMessage);

    try {
      const wrapWithSignatureTx = await libContract.wrapWithSignature(
        messageHash,
        sig.v,
        sig.r,
        sig.s,
        "0x4117281888B76eBCA9CF31562199CD5804B20DA0", // address (A)
        {
          value: parseEther(amount),
        }
      );

      await wrapWithSignatureTx.wait();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  useEffect(() => {
    getOwner();
  }, []);

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
          Wrap ETH
        </button>
        <button onClick={handleLibToEth} disabled={loading}>
          Unwrap ETH
        </button>
      </div>
      {isOwner && (
        <div>
          <button onClick={handleWithdraw}>Withdraw</button>
        </div>
      )}
      <div>
        <button onClick={handleWrapTokenWithSignature}>
          Wrap with Signature
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
