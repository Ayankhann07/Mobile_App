import { useContext } from "react";
import { IncomingGiftsContext } from "../context/IncomingGiftsContext";

export function useIncomingGifts() {
  const context = useContext(IncomingGiftsContext);
  if (!context) {
    throw new Error("useIncomingGifts must be used within an IncomingGiftsProvider");
  }
  return context;
}
