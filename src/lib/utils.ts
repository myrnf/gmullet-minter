import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CA, EthereumProvider } from "@arcana/ca-sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CA: Start
// Singleton for CA instance

let ca: CA | null = null;
const getCA = (provider: EthereumProvider) => {
  if (!ca) {
    ca = new CA(provider);
  }
  return ca;
};

const asyncIntervals: Array<boolean> = [];

const runAsyncInterval = async (
  cb: () => Promise<void>,
  interval: number,
  intervalIndex: number
) => {
  await cb();
  if (asyncIntervals[intervalIndex]) {
    setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval);
  }
};

const setAsyncInterval = (cb: () => Promise<void>, interval: number) => {
  if (cb && typeof cb === "function") {
    const intervalIndex = asyncIntervals.length;
    asyncIntervals.push(true);
    runAsyncInterval(cb, interval, intervalIndex);
    return intervalIndex;
  } else {
    throw new Error("Callback must be a function");
  }
};

const clearAsyncInterval = (intervalIndex: number) => {
  if (asyncIntervals[intervalIndex]) {
    asyncIntervals[intervalIndex] = false;
  }
};

export { setAsyncInterval, clearAsyncInterval };

export { getCA };
// CA: End
