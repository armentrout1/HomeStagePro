/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { log } from "../vite";
import type { LayoutConstraints } from "./layoutAnalyzer";
import {
  GLOBAL_GUARDRAILS,
  ROOM_SPECIFIC_GUARDRAILS,
} from "./stagingPrompt/guardrails";
import { normalizeRoomType } from "./stagingPrompt/normalizeRoomType";
import { buildLivingRoomStrictBlocks } from "./stagingPrompt/blocks/livingRoomStrictBlocks";
import { buildBedroomStrictBlocks } from "./stagingPrompt/blocks/bedroomStrictBlocks";
import { buildKitchenStrictBlocks } from "./stagingPrompt/blocks/kitchenStrictBlocks";
import { buildBathroomStrictBlocks } from "./stagingPrompt/blocks/bathroomStrictBlocks";
import { determineLivingRoomProfile } from "./stagingPrompt/profiles/livingRoomProfile";
import { determineBedroomProfile } from "./stagingPrompt/profiles/bedroomProfile";
import { determineKitchenProfile } from "./stagingPrompt/profiles/kitchenProfile";
import { determineBathroomProfile } from "./stagingPrompt/profiles/bathroomProfile";

export type RoomType = string;

type BuildPromptOptions = {
  layoutConstraints?: LayoutConstraints | null;
};

export const buildStagingPrompt = (
  roomType: RoomType,
  options: BuildPromptOptions = {}
): string => {
  const normalizedRoomType = normalizeRoomType(roomType);
  const roomLabel = roomType?.trim() || "room";

  const baseInstructions = `Add realistic, stylish furniture and home décor to this empty ${roomLabel}. Match the existing lighting, shadows, and perspective so the staging looks naturally photographed.`;

  const guardrails: string[] = [...GLOBAL_GUARDRAILS];

  if (ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]) {
    guardrails.push(...ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]);
  }

  let prefixBlock = "";
  let suffixBlock = "";
  let forbiddenBlock = "";

  if (normalizedRoomType === "living room") {
    const livingRoomProfile = determineLivingRoomProfile(
      options.layoutConstraints
    );
    log(`LivingRoomProfile=${livingRoomProfile.profile}`);
    if (livingRoomProfile.isConstrained) {
      log("LivingRoomConstrained=true");
    }
    const blocks = buildLivingRoomStrictBlocks(livingRoomProfile.profile, {
      isConstrained: livingRoomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "bedroom") {
    const bedroomProfile = determineBedroomProfile(options.layoutConstraints);
    log(`BedroomProfile=${bedroomProfile.profile}`);
    if (bedroomProfile.isConstrained) {
      log("BedroomConstrained=true");
    }
    const blocks = buildBedroomStrictBlocks(bedroomProfile.profile, {
      isConstrained: bedroomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "kitchen") {
    const kitchenProfile = determineKitchenProfile(options.layoutConstraints);
    log(`KitchenProfile=${kitchenProfile.profile}`);
    if (kitchenProfile.isConstrained) {
      log("KitchenConstrained=true");
    }
    const blocks = buildKitchenStrictBlocks(kitchenProfile.profile, {
      isConstrained: kitchenProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "bathroom") {
    const bathroomProfile = determineBathroomProfile(options.layoutConstraints);
    log(`BathroomProfile=${bathroomProfile.profile}`);
    if (bathroomProfile.isConstrained) {
      log("BathroomConstrained=true");
    }
    const blocks = buildBathroomStrictBlocks(bathroomProfile.profile, {
      isConstrained: bathroomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  return [prefixBlock, baseInstructions, guardrails.join(" "), suffixBlock, forbiddenBlock]
    .filter(Boolean)
    .join(" ");
};
