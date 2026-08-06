import "server-only";

export const appleWalletConfigured = Boolean(
  process.env.APPLE_PASS_TYPE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PASS_CERT_BASE64 &&
    process.env.APPLE_PASS_CERT_PASSWORD &&
    process.env.APPLE_WWDR_CERT_BASE64
);

export type AppleWalletCardInput = {
  cardId: string;
  fullName: string;
  jobTitle?: string | null;
  orgName: string;
  phone?: string | null;
  email?: string | null;
  primaryColorHex: string;
  cardUrl: string;
};

// Generates a signed .pkpass buffer. This needs a paid Apple Developer
// Program membership, a Pass Type ID + its certificate (.p12, base64'd into
// APPLE_PASS_CERT_BASE64) and Apple's WWDR intermediate certificate
// (APPLE_WWDR_CERT_BASE64) — see the post-build checklist. The pkpass format
// (pass.json + manifest.json SHA1 hashes + a detached PKCS#7 signature,
// zipped) involves real binary signing that can't be verified without those
// certs, so rather than ship untestable signing code, this throws until
// configured. When ready: `npm install passkit-generator`, then build the
// pass with:
//
//   import { PKPass } from "passkit-generator";
//   const pass = await PKPass.from({
//     model: "<path to a .pass model folder with pass.json/icons>",
//     certificates: {
//       wwdr: Buffer.from(process.env.APPLE_WWDR_CERT_BASE64!, "base64"),
//       signerCert: Buffer.from(process.env.APPLE_PASS_CERT_BASE64!, "base64"),
//       signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD,
//     },
//   }, { serialNumber: input.cardId, description: input.fullName, ... });
//   return pass.getAsBuffer();
export async function buildAppleWalletPass(
  _input: AppleWalletCardInput
): Promise<Buffer> {
  if (!appleWalletConfigured) {
    throw new Error("Apple Wallet is not configured (see .env checklist)");
  }
  throw new Error(
    "Apple Wallet certs are set, but pass generation isn't wired up yet — install passkit-generator and implement buildAppleWalletPass (see comment above)."
  );
}
