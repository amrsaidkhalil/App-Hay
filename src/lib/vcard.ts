export type VCardInput = {
  fullName: string;
  orgName: string;
  jobTitle?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
};

function escapeVCard(value: string) {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildVCard(input: VCardInput): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(input.fullName)}`,
    `N:${escapeVCard(input.fullName)};;;;`,
    `ORG:${escapeVCard(input.orgName)}`,
  ];
  if (input.jobTitle) lines.push(`TITLE:${escapeVCard(input.jobTitle)}`);
  if (input.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(input.phone)}`);
  if (input.whatsapp)
    lines.push(`TEL;TYPE=CELL:${escapeVCard(input.whatsapp)}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(input.email)}`);
  if (input.website) lines.push(`URL:${escapeVCard(input.website)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
