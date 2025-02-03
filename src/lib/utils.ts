import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CA, EthereumProvider } from "@arcana/ca-sdk"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// CA: Singleton for CA instance
let ca: CA | null = null
const getCA = (provider: EthereumProvider) => {
  if (!ca) {
    ca = new CA(provider);
  }
  return ca
}

export { getCA }