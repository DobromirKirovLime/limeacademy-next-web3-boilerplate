import LIMETOKEN_ABI from "../contracts/LimeToken.json";
import type { LimeToken } from "../contracts/types";
import useContract from "./useContract";

export default function useLimeToken(contractAddress?: string) {
  return useContract<LimeToken>(contractAddress, LIMETOKEN_ABI);
}