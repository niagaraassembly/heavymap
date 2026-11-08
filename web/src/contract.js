// Supported wire names. Synthetic local IDs below are illustrative, not registry ULIDs.
export const ID_FIELD = "heavymap_id";
export const ID_PREFIX = "hm:ca:on:hamilton:parcel:";

export function formatAreaShare(share, areaM2 = 0) {
  if (!Number.isFinite(share) || share < 0 || share > 1) {
    throw new RangeError("Area share must be a fraction between 0 and 1");
  }
  if (share === 0 && areaM2 > 0) return "below 0.01%";
  if (share === 0) return "0%";
  if (share < 0.0001) return "below 0.01%";
  if (share < 0.001) return "below 0.1%";
  return `${(share * 100).toFixed(1)}%`;
}
