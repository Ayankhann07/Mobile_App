import { DEALER_NAME } from "../config";
import type { MetalType } from "../services/types";

/**
 * Builds an inviting re-share message for an already-sent, still-unclaimed Gold Lifafa
 * (the buy screen uses the backend's fresher `shareMessage` instead — this is only for
 * re-sharing from My Gifts, where the API doesn't return one).
 */
export function buildGiftShareMessage(params: {
  senderName: string;
  metalType: MetalType;
  title: string | null;
  shareLink: string;
}): string {
  const metalLabel = params.metalType === "GOLD" ? "gold" : "silver";
  const giftLabel = params.title?.trim() || (params.metalType === "GOLD" ? "A gold gift" : "A silver gift");

  return `${params.senderName} sent you a gift 🎁\n${giftLabel} is waiting for you.\n\nOpen it on ${DEALER_NAME} to claim your ${metalLabel}.\n${params.shareLink}`;
}
