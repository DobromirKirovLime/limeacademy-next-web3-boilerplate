import React, { useEffect, useState } from "react";
import useLibraryContract from "../hooks/useLibraryContract";
import { useWeb3React } from "@web3-react/core";
import LoadingSpinner from "./LoadingSpinner";
import BookCard from "./BookCard";
import Input from "./Input";
import Ul from "./Ul";

interface LibraryProps {
  contractAddress: any;
}

enum Actions {
  ADD_BOOK = "Add Book",
  ADD_COPIES = "Add Copies",
  DELETE = "Delete Book",
  BORROW = "Borrow Book",
  RETURN = "Return Book",
  CHECK_SPECIFIC = "Check Specific Book",
  MY_BOOKS = "My Borrowed Books",
}

const libraryInitialState = {
  bookId: 0,
  bookName: "",
  copies: 0,
};

const specificBookInitialState = { id: 0, name: "", copies: 0 };

const Library = ({ contractAddress }: LibraryProps) => {
  const { account } = useWeb3React();
  const libraryContract = useLibraryContract(contractAddress);
  const [isOwner, setIsOwner] = useState(false);
  const [activePage, setActivePage] = useState<string>(Actions.BORROW);
  const [libraryState, setLibraryState] = useState(libraryInitialState);
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const [specificBook, setSpecificBook] = useState(specificBookInitialState);
  const [userBooks, setUserBooks] = useState(undefined);

  const { bookId, bookName, copies } = libraryState;

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

      setSpecificBook({
        id: checkBook.id.toNumber(),
        name: checkBook.name,
        copies: checkBook.copies.toNumber(),
      });

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

      case Actions.BORROW:
        try {
          const borrowTx = await libraryContract.getBook(Number(bookId));
          setPendingTransactionHash(borrowTx.hash);
          await borrowTx.wait();
        } catch (err) {
          setError(err);
          setLoading(loading);
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
        checkSpecificBook(bookId);
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
            Actions.BORROW,
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
          {activePage === Actions.BORROW && (
            <Input
              id="bookId"
              label="Book ID"
              type="number"
              value={bookId}
              onChange={handleInputChange}
            />
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
