import { GoogleGenAI } from "@google/genai";
import { GasBlock } from "../types";

const SYSTEM_INSTRUCTION = `
You are a creative digital artist and blockchain philosopher. 
Your task is to analyze a sequence of Arbitrum Gas Price data and generate a short, 
poetic, and "cyberpunk" style description for an NFT that represents this musical moment.
Focus on the "mood" of the network (e.g., congested = frantic, low gas = zen/calm).
Keep the description under 50 words.
`;

export const generateNftDescription = async (blocks: GasBlock[]): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found. Returning fallback description.");
    return "A procedurally generated melody based on the heartbeat of the Arbitrum network. Captured in a moment of digital time.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Calculate simple stats to feed the model
    const avgGas = (blocks.reduce((acc, b) => acc + b.baseFeePerGas, 0) / blocks.length).toFixed(4);
    const maxGas = Math.max(...blocks.map(b => b.baseFeePerGas)).toFixed(4);
    const minGas = Math.min(...blocks.map(b => b.baseFeePerGas)).toFixed(4);

    const prompt = `
      Analyze this Arbitrum gas data sequence (Last ${blocks.length} blocks):
      Average Gas: ${avgGas} Gwei
      Peak Gas: ${maxGas} Gwei
      Lowest Gas: ${minGas} Gwei
      
      Generate a poetic, futuristic description for this "Gas Music" NFT.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      }
    });

    return response.text || "Melody of the Machine.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "A unique audio-visual snapshot of the Arbitrum blockchain state.";
  }
};
