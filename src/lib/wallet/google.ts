import "server-only";
import { SignJWT, importPKCS8 } from "jose";

export const googleWalletConfigured = Boolean(
  process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY
);

export type GoogleWalletCardInput = {
  cardId: string;
  fullName: string;
  jobTitle?: string | null;
  orgName: string;
  phone?: string | null;
  email?: string | null;
  primaryColorHex: string;
  cardUrl: string;
};

// Builds an "Add to Google Wallet" link. Unlike Apple Wallet, no binary
// signing or server round-trip is required: Google Wallet accepts a signed
// JWT describing a GenericObject, and https://pay.google.com/gp/v/save/<jwt>
// creates the pass client-side. Needs a Google Wallet Issuer account
// (console.cloud.google.com > Google Wallet API) plus a service account with
// the "Wallet Object Issuer" role.
export async function buildGoogleWalletSaveUrl(
  input: GoogleWalletCardInput
): Promise<string> {
  if (!googleWalletConfigured) {
    throw new Error("Google Wallet is not configured (see .env checklist)");
  }

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKeyPem = process.env.GOOGLE_WALLET_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  const objectId = `${issuerId}.${input.cardId}`;

  const genericObject = {
    id: objectId,
    classId: `${issuerId}.digital_card`,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    cardTitle: { defaultValue: { language: "en", value: input.orgName } },
    subheader: { defaultValue: { language: "en", value: input.jobTitle ?? "" } },
    header: { defaultValue: { language: "en", value: input.fullName } },
    hexBackgroundColor: input.primaryColorHex,
    barcode: { type: "QR_CODE", value: input.cardUrl },
  };

  const key = await importPKCS8(privateKeyPem, "RS256");
  const jwt = await new SignJWT({
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    payload: { genericObjects: [genericObject] },
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .sign(key);

  return `https://pay.google.com/gp/v/save/${jwt}`;
}
