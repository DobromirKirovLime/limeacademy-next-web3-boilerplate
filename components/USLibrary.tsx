import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useUSElectionContract from "../hooks/useUSElectionContract";
import LoadingSpinner from "./LoadingSpinner";
import { useDebouncer } from "../hooks/useDebouncer";

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
    isElectionEnded: false,
  };

  const [electionState, setElectionState] = useState(initialElectionState);
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [currentSeatsWon, setCurrentSeatsWon] = useState({
    biden: 0,
    trump: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(undefined);

  const {
    currentLeader,
    votesBiden,
    votesTrump,
    electionStateName,
    electionStateSeats,
    isElectionEnded,
  } = electionState;

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

  const submitStateResults = async () => {
    try {
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
    } catch (err) {
      setLoading(false);
      setError(JSON.parse(JSON.stringify(err)));
    }
  };

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

  const getCurrentSeats = async () => {
    try {
      const biden = await usElectionContract.seats(Leader.BIDEN);
      const trump = await usElectionContract.seats(Leader.TRUMP);
      setCurrentSeatsWon({ biden, trump });
    } catch (err) {
      setError(JSON.parse(JSON.stringify(err)));
    }
  };

  const getStateStatus = async () => {
    try {
      const isStateAlreadySubmitted = await usElectionContract.resultSubmitted(
        electionStateName
      );

      if (isStateAlreadySubmitted) {
        return setError("This state has already submitted their results!");
      }
      setError(undefined);
    } catch (err) {
      setError(JSON.parse(JSON.stringify(err)));
    }
  };

  const endElection = async () => {
    try {
      const endElectionTx = await usElectionContract.endElection();
      await endElectionTx.wait();
      electionEnded();
    } catch (err) {
      setError(JSON.parse(JSON.stringify(err)));
    }
  };

  const electionEnded = async () => {
    try {
      const electionEndedTx = await usElectionContract.electionEnded();
      setElectionState((prev) => ({
        ...prev,
        isElectionEnded: electionEndedTx,
      }));
    } catch (err) {
      setError(JSON.parse(JSON.stringify(err)));
    }
  };

  const resetForm = async () => {
    setElectionState(initialElectionState);
    setPendingTransactionHash("");
    setLoading(false);
    getCurrentLeader();
    getCurrentSeats();
  };

  useDebouncer(getStateStatus, electionStateName, 600);

  useEffect(() => {
    getCurrentLeader();
    getCurrentSeats();
    electionEnded();
  }, []);

  return (
    <div className="results-form">
      <h3>Current Leader is: {currentLeader}</h3>
      <div className="results-seats-won">
        <p>Biden seats won: {currentSeatsWon.biden}</p>
        <hr />
        <p>Trump seats won: {currentSeatsWon.trump}</p>
      </div>
      {isElectionEnded ? (
        <h3>Election has ended!</h3>
      ) : (
        <>
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
            <button onClick={submitStateResults} disabled={error}>
              Submit Results
            </button>
            <button onClick={endElection} disabled={error}>
              End Election
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
        </>
      )}
      {error && (
        <div className="results-error">{error?.error?.message || error}</div>
      )}
    </div>
  );
};

export default USLibrary;
