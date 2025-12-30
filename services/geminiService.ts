
import { GoogleGenAI } from "@google/genai";
import { Temple } from "../types";

export const fetchTempleInfo = async (templeName: string): Promise<{ description: string; sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using 2.5 flash as it's efficient for grounding
      contents: `${templeName}というお寺の由緒、歴史、特徴について詳しく日本語で説明してください。`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const description = response.text || "情報を取得できませんでした。";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      description,
      sources,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      description: "お寺の情報を取得中にエラーが発生しました。",
      sources: [],
    };
  }
};

export const searchTemplesInArea = async (lat: number, lng: number): Promise<Temple[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "現在の場所の近くにある、除夜の鐘を鳴らすことができる有名なお寺を5つほどリストアップしてください。名前と住所、正確な緯度経度を含めてください。",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              address: { type: "STRING" },
              lat: { type: "NUMBER" },
              lng: { type: "NUMBER" }
            },
            required: ["name", "address", "lat", "lng"]
          }
        }
      },
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((item: any, idx: number) => ({
      id: `found-${Date.now()}-${idx}`,
      name: item.name,
      address: item.address,
      location: [item.lat, item.lng]
    }));
  } catch (error) {
    console.error("Map Search Error:", error);
    return [];
  }
};
