import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import Link from "next/link";
import Account from "../components/Account";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import TokenBalance from "../components/TokenBalance";
import USLibrary from "../components/USLibrary";
import LimeToken from "../components/LimeToken";
import {
  ALBT_TOKEN_ADDRESS,
  US_ELECTION_ADDRESS,
  LIBRARY_ADDRESS,
  LMT_ADDRESS,
} from "../constants";
import useEagerConnect from "../hooks/useEagerConnect";
import Library from "../components/Library";
import { useState } from "react";

function Home() {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  const [activeApp, setActiveApp] = useState("");

  return (
    <div>
      <Head>
        <title>LimeAcademy-boilerplate</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <nav>
          <Link href="/">
            <a>LimeAcademy-boilerplate</a>
          </Link>

          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
        <h1>
          Welcome to{" "}
          <a href="https://github.com/LimeChain/next-web3-boilerplate">
            LimeAcademy-boilerplate
          </a>
        </h1>

        {isConnected && (
          <section>
            <div className="section-header">
              <NativeCurrencyBalance />
              {/* Not sure wy we need this and will comment it out for now */}
              {/* <TokenBalance tokenAddress={ALBT_TOKEN_ADDRESS} symbol="ALBT" /> */}
              <button onClick={() => setActiveApp("elections")}>
                US Elections
              </button>
              <button onClick={() => setActiveApp("library")}>Library</button>
              <button onClick={() => setActiveApp("lmt")}>
                LimeToken (LMT)
              </button>
            </div>
            <hr />
            {activeApp === "elections" && (
              <USLibrary contractAddress={US_ELECTION_ADDRESS} />
            )}
            {activeApp === "library" && (
              <Library contractAddress={LIBRARY_ADDRESS} />
            )}
            {activeApp === "lmt" && <LimeToken contractAddress={LMT_ADDRESS} />}
          </section>
        )}
      </main>

      <style jsx>{`
        nav {
          display: flex;
          justify-content: space-between;
        }
        main {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default Home;
