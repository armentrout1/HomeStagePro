/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { openai } from "../openaiClient";

export type LayoutConstraints = {
  noFurnitureZones: string[];
  preferredPlacements: string[];
  notes: string[];
};

type AnalyzerArgs = {
  roomType: string;
  imageBase64: string;
  mime: string;
};

type ResponseContentPart =
  | { type: "output_text" | "text"; text?: string }
  | { type: "output_json"; json?: unknown }
  | { type: string; [key: string]: unknown };

type ResponsesJSONResult = {
  output?: Array<{
    content?: ResponseContentPart[];
  }>;
  output_text?: string[];
};

const layoutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["noFurnitureZones", "preferredPlacements", "notes"],
  properties: {
    noFurnitureZones: {
      type: "array",
      description:
        "Areas that must stay empty, such as doors, windows, mechanical access, or primary circulation paths.",
      items: {
        type: "string",
      },
    },
    preferredPlacements: {
      type: "array",
      description:
        "High-level placement rules to keep furniture aligned with the architecture and circulation.",
      items: {
        type: "string",
      },
    },
    notes: {
      type: "array",
      description:
        "Additional contextual notes about lighting, windows, ceiling fans, or other layout-sensitive features.",
      items: {
        type: "string",
      },
    },
  },
} as const;

const ANALYZER_SYSTEM_PROMPT = [
  "You are an architectural layout analyst for residential interiors.",
  "Identify every door, doorway, opening, and whether it is open or closed.",
  "Trace the main circulation path from the viewer/entry to other doors or openings.",
  "Describe zones where furniture must NOT be placed so door swings, closet access, windows, and vents stay clear.",
  "Highlight the strongest furniture placements that keep the circulation path open and respect architectural symmetry.",
  "Explicitly ensure all placement guidance keeps door swings and the entry path unobstructed.",
  "Always provide concise phrases; do not write paragraphs.",
].join(" ");

const formatList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeConstraints = (raw: unknown): LayoutConstraints => {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Layout analyzer returned invalid JSON structure");
  }

  const record = raw as Record<string, unknown>;

  return {
    noFurnitureZones: formatList(record.noFurnitureZones),
    preferredPlacements: formatList(record.preferredPlacements),
    notes: formatList(record.notes),
  };
};

const FALLBACK_CONSTRAINTS: LayoutConstraints = {
  noFurnitureZones: [],
  preferredPlacements: [],
  notes: [],
};

const tryParseConstraintsFromText = (
  text: string,
  source: string
): LayoutConstraints | null => {
  try {
    const parsed = JSON.parse(text);
    return normalizeConstraints(parsed);
  } catch (error) {
    console.error(
      `[layoutAnalyzer] Failed to parse analyzer JSON from ${source}: ${
        (error as Error).message
      }`
    );
    return null;
  }
};

const extractConstraintsFromResponse = (
  response: ResponsesJSONResult
): LayoutConstraints => {
  const outputMessages = response.output || [];

  for (const message of outputMessages) {
    for (const part of message.content || []) {
      if (part.type === "output_json" && part.json !== undefined) {
        return normalizeConstraints(part.json);
      }

      if (
        (part.type === "output_text" || part.type === "text") &&
        typeof part.text === "string"
      ) {
        const parsed = tryParseConstraintsFromText(
          part.text,
          `response.output message part`
        );
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  const fallback = response.output_text?.[0];
  if (fallback) {
    const parsed = tryParseConstraintsFromText(
      fallback,
      "response.output_text[0]"
    );
    if (parsed) {
      return parsed;
    }
  }

  console.error(
    "[layoutAnalyzer] Falling back to empty constraints because no structured JSON was returned."
  );
  return FALLBACK_CONSTRAINTS;
};

export const analyzeRoomLayout = async ({
  roomType,
  imageBase64,
  mime,
}: AnalyzerArgs): Promise<LayoutConstraints> => {
  const dataUrl = `data:${mime};base64,${imageBase64}`;

  const payload = {
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: ANALYZER_SYSTEM_PROMPT,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Room type: ${roomType || "Unknown"}.`,
              "Analyze the uploaded photo and return JSON arrays describing:",
              "1) No-furniture zones with exact locations referenced to walls, doors, windows, or circulation paths.",
              "2) Preferred placements for the largest furniture (beds, sofas, dining tables) so they respect the architecture and keep entry paths clear.",
              "3) Supplemental notes about lighting, wall art, rugs, ceiling fans, radiators or other fixtures that impact staging.",
              "Output short, directive phrases (max ~15 words).",
              "Always keep door swings and the entry circulation path fully clear.",
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "layout_constraints",
        schema: layoutSchema,
        strict: true,
      },
    },
  } as Parameters<typeof openai.responses.create>[0];

  const response = (await openai.responses.create(payload)) as unknown as ResponsesJSONResult;

  return extractConstraintsFromResponse(response);
};
