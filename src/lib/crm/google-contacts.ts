import "server-only";
import { prisma } from "@/lib/prisma";

export type SyncableContact = {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
};

// Pushes one ScannedContact into the signed-in user's Google Contacts via the
// People API. Needs a Google OAuth client (AUTH_GOOGLE_ID/SECRET) with the
// https://www.googleapis.com/auth/contacts scope granted at sign-in, and a
// CrmConnection row holding that user's access/refresh token — both are
// Phase 2 (see src/auth.ts and the post-build checklist). Token refresh is
// intentionally not handled here yet: call this right after a fresh sign-in,
// or add refresh-token exchange before relying on it long-term.
export async function syncContactToGoogle(
  userId: string,
  contact: SyncableContact
): Promise<void> {
  const connection = await prisma.crmConnection.findUnique({
    where: { userId_provider: { userId, provider: "GOOGLE_CONTACTS" } },
  });
  if (!connection) {
    throw new Error("No Google Contacts connection for this user yet");
  }

  const response = await fetch(
    "https://people.googleapis.com/v1/people:createContact",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        names: [{ givenName: contact.name }],
        organizations: contact.company
          ? [{ name: contact.company, title: contact.jobTitle ?? undefined }]
          : undefined,
        phoneNumbers: contact.phone ? [{ value: contact.phone }] : undefined,
        emailAddresses: contact.email ? [{ value: contact.email }] : undefined,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Contacts sync failed (${response.status}): ${body}`);
  }
}
