import React, { useEffect, useState } from "react";
import { coinDeskApi } from "../constants";
import { getCurrentDateTimeWithOffset } from "../util";

const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const url = `${coinDeskApi}/tb/price/values/ETH?start_date=${getCurrentDateTimeWithOffset(
        2
      )}&end_date=${getCurrentDateTimeWithOffset(1)}&ohlc=true`;
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          setEthPrice(data.data.entries[0][4]);
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
        });
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return ethPrice;
};

export default useEthPrice;
