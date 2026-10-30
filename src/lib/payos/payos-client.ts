import { PayOS } from '@payos/node';

let payosInstance: PayOS | null = null;

export function getPayOSClient(): PayOS | null {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }

  if (!payosInstance) {
    payosInstance = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  return payosInstance;
}
