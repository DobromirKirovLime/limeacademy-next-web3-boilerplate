import React, { useEffect, useState } from "react";
import useLibraryContract from "../hooks/useLibraryContract";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import LoadingSpinner from "./LoadingSpinner";
import BookCard from "./BookCard";
import Input from "./Input";
import Ul from "./Ul";
import useTokenContract from "../hooks/useLibTokenContract";
import { parseEther } from "@ethersproject/units";
import { LIB_TOKEN_ADDRESS } from "../constants";
import { showNotification } from "../util";
import { ethers, utils } from "ethers";
import LibraryABI from "../contracts/Library.json";

interface LibraryProps {
  contractAddress: any;
}

enum Actions {
  ADD_BOOK = "Add Book",
  ADD_COPIES = "Add Copies",
  DELETE = "Delete Book",
  RENT = "Rent Book",
  RENT_SIG = "Rent for somebody",
  RETURN = "Return Book",
  CHECK_SPECIFIC = "Check Specific Book",
  MY_BOOKS = "My Borrowed Books",
}

const libraryInitialState = {
  bookId: 0,
  bookName: "",
  copies: 0,
  address: "",
  msgHash: "",
  signedMsg: "",
};

const specificBookInitialState = { id: 0, name: "", copies: 0 };

const Library = ({ contractAddress }: LibraryProps) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const libraryContract = useLibraryContract(contractAddress);
  const libToken = useTokenContract(LIB_TOKEN_ADDRESS);
  const [isOwner, setIsOwner] = useState(false);
  const [activePage, setActivePage] = useState<string>(Actions.RENT);
  const [libraryState, setLibraryState] = useState(libraryInitialState);
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const [specificBook, setSpecificBook] = useState(specificBookInitialState);
  const [userBooks, setUserBooks] = useState(undefined);

  const { bookId, bookName, copies, address, msgHash, signedMsg } =
    libraryState;

  const getBookWithManualEncoding = async () => {
    const iface = new ethers.utils.Interface(LibraryABI);
    const encodedData = iface.encodeFunctionData("getBook", [bookId]);

    const tx = {
      to: contractAddress,
      data: encodedData,
    };

    const signer = library.getSigner();
    const receipt = await signer.sendTransaction(tx);
    setPendingTransactionHash(receipt.hash);
    await receipt.wait();
  };

  const getOwner = async () => {
    const getOwnerTx = await libraryContract.owner();
    setIsOwner(getOwnerTx === account);
  };

  const handleActivePage = (e: React.MouseEvent<HTMLLIElement>) => {
    setLibraryState(libraryInitialState);
    setSpecificBook(specificBookInitialState);
    setActivePage(e.currentTarget.innerText);
    setError(undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    const inputName = e.currentTarget.name;
    const inputValue = e.currentTarget.value;

    setLibraryState((prev) => ({ ...prev, [inputName]: inputValue }));
  };

  const getUserBooks = async () => {
    const getUserBooksTx = await libraryContract.getCustomerRecord();
    const borrowedBooks = await Promise.all(
      getUserBooksTx.map(async (b) => {
        const resp = await checkSpecificBook(b.toNumber());
        return resp;
      })
    );
    setUserBooks(borrowedBooks.filter((b) => b.id !== 0));
  };

  const checkSpecificBook = async (id) => {
    try {
      const checkBook = await libraryContract.books(Number(id));
      return {
        id: checkBook.id.toNumber(),
        name: checkBook.name,
        copies: checkBook.copies.toNumber(),
      };
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const onAttemptToApprove = async () => {
    const nonce = await libToken.nonces(account); // Our Token Contract Nonces

    const deadline = +new Date() + 60 * 60; // Permit with deadline which the permit is valid

    const wrapValue = utils.parseEther("0.0001"); // Value to approve for the spender to use

    const EIP712Domain = [
      // array of objects -> properties from the contract and the types of them ircwithPermit
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "verifyingContract", type: "address" },
    ];

    const domain = {
      name: await libToken.name(),
      version: "1",
      verifyingContract: libToken.address,
    };

    const Permit = [
      // array of objects -> properties from erc20withpermit
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ];

    const message = {
      owner: account,
      spender: contractAddress,
      value: wrapValue.toString(),
      nonce: nonce.toHexString(),
      deadline,
    };

    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: "Permit",
      message,
    });

    const signatureLike = await library.send("eth_signTypedData_v4", [
      account,
      data,
    ]);

    const signature = utils.splitSignature(signatureLike);

    const preparedSignature = {
      v: signature.v,
      r: signature.r,
      s: signature.s,
      deadline,
      wrapValue,
    };

    return preparedSignature;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    switch (activePage) {
      case Actions.ADD_BOOK:
        try {
          const addBookTx = await libraryContract.addBook(
            Number(bookId),
            bookName,
            Number(copies)
          );
          setPendingTransactionHash(addBookTx.hash);
          const receipt = await addBookTx.wait();
        } catch (err) {
          setError(err);
          setLoading(false);
        }

        break;

      case Actions.ADD_COPIES:
        try {
          const addCopiesTx = await libraryContract.addCopies(
            Number(bookId),
            Number(copies)
          );
          setPendingTransactionHash(addCopiesTx.hash);
          await addCopiesTx.wait();
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        break;

      case Actions.DELETE:
        try {
          const deleteTx = await libraryContract.removeBook(Number(bookId));
          setPendingTransactionHash(deleteTx.hash);
          await deleteTx.wait();
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        break;

      case Actions.RENT:
        try {
          // This is used in getBookWithManualEncoding() & libraryContract.getBook()
          //
          // const allowanceTx = await libToken.allowance(
          //   account,
          //   contractAddress
          // );
          // const needsApproval =
          //   Number(allowanceTx.toString()) - 100000000000000 <= 0;
          // if (needsApproval) {
          //   const approveTx = await libToken.approve(
          //     contractAddress,
          //     parseEther("0.0005")
          //   );
          //   await approveTx.wait();
          // }
          //
          // This is the second way of doing it
          // await getBookWithManualEncoding();
          //
          // This is the same as the getBookWithManualEncoding()
          // const borrowTx = await libraryContract.getBook(Number(bookId));
          // setPendingTransactionHash(borrowTx.hash);
          // await borrowTx.wait();

          const { wrapValue, deadline, v, r, s } = await onAttemptToApprove();

          const rentBookTx = await libraryContract.getBookWithPermit(
            bookId,
            wrapValue,
            deadline,
            v,
            r,
            s
          );
          setPendingTransactionHash(rentBookTx.hash);
          await rentBookTx.wait();
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(loading);
        }
        break;

      case Actions.RENT_SIG:
        setLoading(true);
        try {
          const sig = utils.splitSignature(signedMsg);
          const rentWithSignature = await libraryContract.getBookWithSignature(
            bookId,
            msgHash,
            sig.v,
            sig.r,
            sig.s,
            address
          );
          setPendingTransactionHash(rentWithSignature.hash);
          await rentWithSignature.wait();
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        break;

      case Actions.RETURN:
        try {
          const returnTx = await libraryContract.returnBook(Number(bookId));
          setPendingTransactionHash(returnTx.hash);
          await returnTx.wait();
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        break;

      case Actions.CHECK_SPECIFIC:
        const result = await checkSpecificBook(bookId);
        setSpecificBook(result);
        break;

      default:
        break;
    }
    resetForm();
  };

  const resetForm = () => {
    setLibraryState(libraryInitialState);
    setPendingTransactionHash("");
    getUserBooks();
    setLoading(false);
  };

  useEffect(() => {
    getOwner();
    getUserBooks();

    // All the listeners for all events that are emited from the smart contract
    libToken.on("Transfer", (from, to, value) => {
      showNotification(
        "Transfer",
        `From: \n${from}\n\nTo: \n${to}\n\nAmount: ${value.toString()}`
      );
    });

    libraryContract.on("LogBookAdded", (id, name, copies) => {
      showNotification(
        "Book Added",
        `BookID: ${id.toString()}\nName: ${name}\nCopies: ${copies.toString()}`
      );
    });

    libraryContract.on("LogCopiesAdded", (id, copies) => {
      showNotification(
        "Copies added",
        `BookID: ${id.toString()}\nCopies added: ${copies.toString()}`
      );
    });

    libraryContract.on("LogBookRemoved", (id) => {
      showNotification(
        "Book removed",
        `Book with ID ${id.toString()} was removed!`
      );
    });

    libraryContract.on("LogBookWasTaken", (id, byAddress) => {
      showNotification(
        "Book was taken",
        `BookID: ${id.toString()}\nWas taken by: ${byAddress}`
      );
    });

    libraryContract.on("LogBookWasReturned", (id) => {
      showNotification(
        "Book was returned",
        `Book with ID ${id.toString()} returned!`
      );
    });

    return () => {
      libToken.removeAllListeners();
      libraryContract.removeAllListeners();
    };
  }, []);

  return (
    <div className="lib">
      <div className="lib-nav">
        <h3>LimeLibrary</h3>
        {isOwner && (
          <Ul
            ulName="Owner Section"
            items={[Actions.ADD_BOOK, Actions.ADD_COPIES, Actions.DELETE]}
            onClick={handleActivePage}
          />
        )}
        <Ul
          ulName="User Section"
          items={[
            Actions.RENT,
            Actions.RENT_SIG,
            Actions.RETURN,
            Actions.CHECK_SPECIFIC,
            Actions.MY_BOOKS,
          ]}
          onClick={handleActivePage}
        />
      </div>
      <form onSubmit={handleFormSubmit} className="lib-form">
        <div className="lib-section">
          <h3>{activePage}</h3>
          {activePage === Actions.ADD_BOOK && (
            <>
              <Input
                id="bookId"
                label="Book ID"
                type="number"
                value={bookId}
                onChange={handleInputChange}
              />
              <Input
                id="bookName"
                label="Book Name"
                type="text"
                value={bookName}
                onChange={handleInputChange}
              />
              <Input
                id="copies"
                label="Book Copies"
                type="number"
                value={copies}
                onChange={handleInputChange}
              />
            </>
          )}
          {activePage === Actions.ADD_COPIES && (
            <>
              <Input
                id="bookId"
                label="Book ID"
                type="number"
                value={bookId}
                onChange={handleInputChange}
              />
              <Input
                id="copies"
                label="Book Copies"
                type="number"
                value={copies}
                onChange={handleInputChange}
              />
            </>
          )}
          {activePage === Actions.DELETE && (
            <Input
              id="bookId"
              label="Book ID"
              type="number"
              value={bookId}
              onChange={handleInputChange}
            />
          )}
          {activePage === Actions.RENT && (
            <>
              <Input
                id="bookId"
                label="Book ID"
                type="number"
                value={bookId}
                onChange={handleInputChange}
              />
              <p>Cost: 0.0001 LIB</p>
            </>
          )}
          {activePage === Actions.RENT_SIG && (
            <>
              <Input
                id="bookId"
                label="Book ID"
                type="number"
                value={bookId}
                onChange={handleInputChange}
              />
              <Input
                id="address"
                label="Reciever address"
                type="text"
                value={address}
                onChange={handleInputChange}
              />
              <Input
                id="msgHash"
                label="Reciever hashed msg"
                type="text"
                value={msgHash}
                onChange={handleInputChange}
              />
              <Input
                id="signedMsg"
                label="Reciever signed msg"
                type="text"
                value={signedMsg}
                onChange={handleInputChange}
              />
            </>
          )}
          {activePage === Actions.RETURN && (
            <Input
              id="bookId"
              label="Book ID"
              type="number"
              value={bookId}
              onChange={handleInputChange}
            />
          )}
          {activePage === Actions.CHECK_SPECIFIC && (
            <Input
              id="bookId"
              label="Book ID"
              type="number"
              value={bookId}
              onChange={handleInputChange}
            />
          )}
          {activePage !== Actions.MY_BOOKS && (
            <button type="submit">Submit</button>
          )}
          {specificBook.name && activePage === Actions.CHECK_SPECIFIC && (
            <BookCard
              id={specificBook.id}
              name={specificBook.name}
              copies={specificBook.copies}
            />
          )}
          {activePage === Actions.MY_BOOKS && (
            <div className="lib-books">
              {userBooks.map((book) => {
                return (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    name={book.name}
                    copies={book.copies}
                  />
                );
              })}
            </div>
          )}
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
      </form>
    </div>
  );
};

export default Library;
