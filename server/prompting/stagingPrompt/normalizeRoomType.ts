export const normalizeRoomType = (roomType?: string): string =>
  roomType?.trim().toLowerCase() || "room";
