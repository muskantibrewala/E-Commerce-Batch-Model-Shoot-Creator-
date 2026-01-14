
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_GUIDELINES } from "../constants";
import { BackgroundConfig } from "../types";

export const generateStudioShot = async (
  base64Image: string,
  shotInstruction: string,
  customNotes: string,
  modelProfile: string,
  background: BackgroundConfig
): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: 'image/png',
        },
      }
    ];

    // If there's a custom background image, send it as a reference part
    if (background.type === 'image') {
      parts.push({
        inlineData: {
          data: background.value.split(',')[1],
          mimeType: 'image/png',
        },
      });
    }

    let backgroundInstruction = "";
    if (background.type === 'color') {
      backgroundInstruction = `The background MUST be a solid, seamless, perfectly flat color with hex code ${background.value}. No gradients or textures.`;
    } else {
      backgroundInstruction = `The background MUST use the provided environment image as the backdrop. The model should look like she is standing naturally in that specific environment.`;
    }

    parts.push({
      text: `${SYSTEM_GUIDELINES}
            
STRICT SESSION CONSISTENCY REQUIREMENT:
For this specific product photoshoot session, you must adhere to these identity and environmental constraints:

BACKGROUND CONFIGURATION:
${backgroundInstruction}
Ensure the lighting on the model matches the background perfectly while maintaining the shadowless, diffused high-key studio aesthetic.

MODEL PROFILE (MUST REMAIN IDENTICAL ACROSS ALL SHOTS):
${modelProfile}

SPECIFIC SHOT INSTRUCTION: ${shotInstruction}

ADDITIONAL CUSTOMER REQUIREMENTS: ${customNotes}

Generate the final professional 9:16 portrait fashion photograph following these instructions precisely. 
STRICTLY NO LOGOS, WATERMARKS, TEXT, OR CAST SHADOWS.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "9:16" 
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Studio API Error:", error);
    throw error;
  }
};
