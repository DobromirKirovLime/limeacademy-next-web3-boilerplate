import React, { useEffect, useState } from "react";
import useLibraryContract from "../hooks/useLibraryContract";
import { useWeb3React } from "@web3-react/core";
import LoadingSpinner from "./LoadingSpinner";

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
  const [activePage, setActivePage] = useState<string>(Actions.ADD_BOOK);
  const [libraryState, setLibraryState] = useState(libraryInitialState);
  const [pendingTransactionHash, setPendingTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    switch (activePage) {
      case Actions.ADD_BOOK:
        const addBookTx = await libraryContract.addBook(
          Number(bookId),
          bookName,
          Number(copies)
        );
        setPendingTransactionHash(addBookTx.hash);
        const receipt = await addBookTx.wait();
        console.log(receipt);

        break;

      case Actions.ADD_COPIES:
        const addCopiesTx = await libraryContract.addCopies(
          Number(bookId),
          Number(copies)
        );
        setPendingTransactionHash(addCopiesTx.hash);
        await addCopiesTx.wait();
        break;

      case Actions.DELETE:
        const deleteTx = await libraryContract.removeBook(Number(bookId));
        setPendingTransactionHash(deleteTx.hash);
        await deleteTx.wait();
        break;

      case Actions.BORROW:
        const borrowTx = await libraryContract.getBook(Number(bookId));
        setPendingTransactionHash(borrowTx.hash);
        await borrowTx.wait();
        break;

      case Actions.RETURN:
        const returnTx = await libraryContract.returnBook(Number(bookId));
        setPendingTransactionHash(returnTx.hash);
        await returnTx.wait();
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

  // add book by click
  // add copies by click
  // del book by click
  // borrow book by click
  // return book by click
  // check specific book by click
  // check my borrowed books on render

  return (
    <div className="lib">
      <div className="lib-nav">
        <h3>LimeLibrary</h3>
        {isOwner && (
          <>
            <p>Owner Section</p>
            <ul className="lib-nav-section admin">
              <li onClick={handleActivePage}>{Actions.ADD_BOOK}</li>
              <li onClick={handleActivePage}>{Actions.ADD_COPIES}</li>
              <li onClick={handleActivePage}>{Actions.DELETE}</li>
            </ul>
          </>
        )}
        <p>User Section</p>
        <ul className="lib-nav-section">
          <li onClick={handleActivePage}>{Actions.BORROW}</li>
          <li onClick={handleActivePage}>{Actions.RETURN}</li>
          <li onClick={handleActivePage}>{Actions.CHECK_SPECIFIC}</li>
          <li onClick={handleActivePage}>{Actions.MY_BOOKS}</li>
        </ul>
      </div>
      <form onSubmit={handleFormSubmit} className="lib-form">
        <div className="lib-section">
          <h3>{activePage}</h3>
          {activePage === Actions.ADD_BOOK && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
              <label htmlFor="bookName">Book name</label>
              <input
                onChange={handleInputChange}
                value={bookName}
                type="text"
                name="bookName"
              />
              <label htmlFor="copies">Book copies</label>
              <input
                onChange={handleInputChange}
                value={copies}
                type="number"
                name="copies"
              />
            </>
          )}
          {activePage === Actions.ADD_COPIES && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
              <label htmlFor="copies">Copies</label>
              <input
                onChange={handleInputChange}
                value={copies}
                type="number"
                name="copies"
              />
            </>
          )}
          {activePage === Actions.DELETE && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
            </>
          )}
          {activePage === Actions.BORROW && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
            </>
          )}
          {activePage === Actions.RETURN && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
            </>
          )}
          {activePage === Actions.CHECK_SPECIFIC && (
            <>
              <label htmlFor="bookId">Book ID</label>
              <input
                onChange={handleInputChange}
                value={bookId}
                type="number"
                name="bookId"
              />
            </>
          )}
          {activePage !== Actions.MY_BOOKS && (
            <button type="submit">Submit</button>
          )}
          {activePage === Actions.MY_BOOKS && (
            <div>
              {userBooks.map((book) => {
                return (
                  <div key={book.id}>
                    <p>№: {book.id}</p>
                    <p>{book.name}</p>
                    <p>Available copies: {book.copies}</p>
                  </div>
                );
              })}
            </div>
          )}
          {specificBook.name && activePage === Actions.CHECK_SPECIFIC && (
            <>
              <p>№: {specificBook.id}</p>
              <p>{specificBook.name}</p>
              <p>Available copies: {specificBook.copies}</p>
            </>
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
      </form>
    </div>
  );
};

export default Library;
