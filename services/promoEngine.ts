import { Product, PromoHint } from '../types';

export function calculatePromoHints(product: Product, currentQty: number): { hints: PromoHint[], earnedGifts: number } {
  const hints: PromoHint[] = [];
  let earnedGifts = 0;
  const rulesText = product.promoRules || "";
  
  const bogoRegex = /(\d+)送(\d+)/g;
  let bMatch;
  while ((bMatch = bogoRegex.exec(rulesText)) !== null) {
    const buy = parseInt(bMatch[1]);
    const free = parseInt(bMatch[2]);
    if (currentQty >= buy) earnedGifts = Math.floor(currentQty / buy) * free;
  }

  const discountRegex = /(\d+)盒折(\d+)/g;
  let dMatch;
  while ((dMatch = discountRegex.exec(rulesText)) !== null) {
    const threshold = parseInt(dMatch[1]);
    const discount = parseInt(dMatch[2]);
    if (currentQty < threshold) {
      hints.push({
        nextThreshold: threshold,
        savings: discount,
        avgPrice: 0,
        message: `再買 ${threshold - currentQty} 盒折 ${discount} 元`
      });
    }
  }

  return { hints, earnedGifts };
}
