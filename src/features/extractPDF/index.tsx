import { extractOCBCCreditCard } from './extractOCBCCreditCard';
import { extractOCBCAccount } from './extractOCBCAccount';

export type PDFType = 'ocbc-credit-card' | 'ocbc-account';

export async function extractByType(type: PDFType, buffer: ArrayBuffer): Promise<string[][]> {
  switch (type) {
    case 'ocbc-credit-card':
      return (extractOCBCCreditCard(buffer));
    case 'ocbc-account':
      return (extractOCBCAccount(buffer));
    default:
      throw new Error(`Unsupported PDF type: ${type}`);
  }
}