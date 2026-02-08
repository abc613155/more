import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export async function getProductRecommendation(query: string, products: Product[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const productContext = products.map(p => `- ${p.brand} ${p.style}: $${p.price}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `用繁體中文回答關於隱形眼鏡的問題。根據以下清單給予建議：\n${productContext}\n\n使用者問題：${query}`
  });

  return response.text || "抱歉，目前無法提供建議。";
}
