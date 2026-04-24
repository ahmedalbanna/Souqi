import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface ProcessedPriceReport {
  cropId: string;
  marketId: string;
  price: number;
  unit: string;
  confidence: number;
}

export async function processYemeniVoiceToPrice(transcript: string): Promise<ProcessedPriceReport | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `حول الكلام باللهجة اليمنية التالي إلى بيانات منظمة لسعر محاصيل.
    النص: "${transcript}"
    
    أمثلة للأسواق: صنعاء، تعز، عدن، سيئون، زبيد، الحديدة.
    أمثلة للمحاصيل: طماط، بصل، بطاط، عسل سدر، بن يافعي، قات، تمن.
    
    المخرج يجب أن يكون بصيغة JSON حصراً.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cropId: { type: Type.STRING, description: "اسم المحصول باللغة العربية (مثلاً: طماط)" },
          marketId: { type: Type.STRING, description: "اسم السوق (مثلاً: صنعاء)" },
          price: { type: Type.NUMBER, description: "السعر بالريال اليمني" },
          unit: { type: Type.STRING, description: "الوحدة (مثلاً: سلة، كيلو، كيس)" },
          confidence: { type: Type.NUMBER, description: "مدى الثقة بالتحليل من 0 إلى 1" }
        },
        required: ["cropId", "marketId", "price", "unit"]
      }
    }
  });

  try {
    return JSON.parse(response.text) as ProcessedPriceReport;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}

export async function getAgriculturalTip(weatherInfo: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `أنت مستشار زراعي خبير في اليمن. قدم نصيحة زراعية صوتية باللهجة اليمنية البسيطة بناءً على حالة الطقس التالية: "${weatherInfo}". النصيحة يجب أن تكون قصيرة ومباشرة.`,
  });
  return response.text;
}
