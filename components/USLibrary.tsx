import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useUSElectionContract from "../hooks/useUSElectionContract";
import LoadingSpinner from "./LoadingSpinner";

type USContract = {
  contractAddress: string;
};

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP,
}

const USLibrary = ({ contractAddress }: USContract) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const usElectionContract = useUSElectionContract(contractAddress);

  const initialElectionState = {
    electionStateName: "",
    currentLeader: "Unknown",
    votesBiden: 0,
    votesTrump: 0,
    electionStateSeats: 0,
  };

  const [electionState, setElectionState] = useState(initialElectionState);
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLeader();
  }, []);

  const getCurrentLeader = async () => {
    const currentLeader = await usElectionContract.currentLeader();
    setElectionState((prev) => ({
      ...prev,
      currentLeader:
        currentLeader == Leader.UNKNOWN
          ? "Unknown"
          : currentLeader == Leader.BIDEN
          ? "Biden"
          : "Trump",
    }));
  };

  const stateInput = (input) => {
    setElectionState((prev) => ({
      ...prev,
      electionStateName: input.target.value,
    }));
  };

  const bideVotesInput = (input) => {
    setElectionState((prev) => ({
      ...prev,
      votesBiden: input.target.value,
    }));
  };

  const trumpVotesInput = (input) => {
    setElectionState((prev) => ({
      ...prev,
      votesTrump: input.target.value,
    }));
  };

  const seatsInput = (input) => {
    setElectionState((prev) => ({
      ...prev,
      electionStateSeats: input.target.value,
    }));
  };

  const {
    currentLeader,
    votesBiden,
    votesTrump,
    electionStateName,
    electionStateSeats,
  } = electionState;

  const submitStateResults = async () => {
    setLoading(true);
    const result: any = [
      electionStateName,
      votesBiden,
      votesTrump,
      electionStateSeats,
    ];
    const tx = await usElectionContract.submitStateResult(result);
    setPendingTransactionHash(tx.hash);
    await tx.wait();
    resetForm();
  };

  const resetForm = async () => {
    setElectionState(initialElectionState);
    setPendingTransactionHash("");
    setLoading(false);
    getCurrentLeader();
  };

  return (
    <div className="results-form">
      <p>Current Leader is: {currentLeader}</p>
      <form className="results-form-element">
        <label>
          State:
          <input
            onChange={stateInput}
            value={electionStateName}
            type="text"
            name="state"
          />
        </label>
        <label>
          BIDEN Votes:
          <input
            onChange={bideVotesInput}
            value={votesBiden}
            type="number"
            name="biden_votes"
          />
        </label>
        <label>
          TRUMP Votes:
          <input
            onChange={trumpVotesInput}
            value={votesTrump}
            type="number"
            name="trump_votes"
          />
        </label>
        <label>
          Seats:
          <input
            onChange={seatsInput}
            value={electionStateSeats}
            type="number"
            name="seats"
          />
        </label>
      </form>
      <div className="button-wrapper">
        <button onClick={submitStateResults}>Submit Results</button>
      </div>
      {loading && (
        <div className="results-loading">
          <div>
            <div>Pending transaction</div>
            <LoadingSpinner />
          </div>
          <div>Transaction HASH: {pendingTransactionHash}</div>
          <a href={`https://sepolia.etherscan.io/tx/${pendingTransactionHash}`}>
            Etherscan URL
          </a>
        </div>
      )}
    </div>
  );
};

export default USLibrary;
