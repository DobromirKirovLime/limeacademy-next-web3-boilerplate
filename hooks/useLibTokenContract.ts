import LibToken_ABI from "../contracts/LibToken.json";
import type { LibToken } from "../contracts/types";
import useContract from "./useContract";

export default function useTokenContract(tokenAddress?: string) {
  return useContract<LibToken>(tokenAddress, LibToken_ABI);
}
