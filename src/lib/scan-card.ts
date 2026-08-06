import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const scannerConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export type ScannedFields = {
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
};

const EMPTY: ScannedFields = {
  name: "",
  jobTitle: "",
  company: "",
  phone: "",
  email: "",
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

export async function scanBusinessCard(
  imageBase64: string,
  mediaType: string
): Promise<ScannedFields> {
  if (!scannerConfigured) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "This is a photo of a physical business card. Extract the person's full name, job title, company name, phone number, and email address. Respond with ONLY a JSON object with keys: name, jobTitle, company, phone, email. Use an empty string for any field you can't find. No prose, no markdown fences.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return EMPTY;

  try {
    const parsed = extractJson(textBlock.text) as Partial<ScannedFields>;
    return {
      name: parsed.name ?? "",
      jobTitle: parsed.jobTitle ?? "",
      company: parsed.company ?? "",
      phone: parsed.phone ?? "",
      email: parsed.email ?? "",
    };
  } catch {
    return EMPTY;
  }
}
