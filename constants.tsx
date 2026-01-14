
import { ShotType, ShotDefinition } from './types';

export const SHOTS: ShotDefinition[] = [
  {
    id: ShotType.HERO,
    label: 'Shot 1 - Vibrant Hero',
    description: '3/4 Front View, full-length, playful energy.',
    instruction: 'Full-length 3/4 front angle standing shot. Model should have a playful stance with an ethereal, ultra-soft glow. Her expression is a warm, genuine laugh. Lighting must be shadowless and high-key.'
  },
  {
    id: ShotType.FRONT,
    label: 'Shot 2 - Animated Front',
    description: 'Straight-on view with an infectious, joyful expression.',
    instruction: 'Straight-on full-length front angle shot. Model is facing the camera directly with a joyful, soft smile. Focus on the soft texture of the fabric. High-key catalog lighting with zero shadows.'
  },
  {
    id: ShotType.SIDE,
    label: 'Shot 3 - Joyful Movement',
    description: 'Dynamic walking motion, front-profile orientation.',
    instruction: 'Capture the model in a light, graceful movement from a slightly turned front-angle. The fabric should flow with a soft, airy quality. Ensure no shadows are cast on the white background.'
  },
  {
    id: ShotType.BACK,
    label: 'Shot 4 - Back Detail',
    description: 'Clean back view, maintaining high-key studio look.',
    instruction: 'Clean back view of the garment. The model might glance over her shoulder toward the front. Lighting must remain perfectly even and shadowless against the white backdrop.'
  },
  {
    id: ShotType.DETAIL,
    label: 'Shot 5 - Sparkling Detail',
    description: 'Waist-up front-facing close-up.',
    instruction: 'Upper body front-facing shot focusing on the neckline and craftsmanship. Use a shallow depth-of-field. The model looks radiant with a gentle, glowing complexion and no shadows under the chin or on the background.'
  },
  {
    id: ShotType.SEATED,
    label: 'Shot 6 - Candid Seated',
    description: 'Relaxed seated pose, facing front/slightly angled.',
    instruction: 'Model sitting gracefully facing forward. The composition should feel high-end and clean. Her laugh is captured warmly, with perfectly diffused, shadowless lighting.'
  }
];

export const SYSTEM_GUIDELINES = `
You are a professional AI fashion photographer for "Artt n Attire", a high-end atelier in Chennai, India. 
Your task is to place the provided product onto a model according to these strict rules:

SOURCE IMAGE HANDLING:
- The input image might show the product on a mannequin, hanging, or laid flat.
- You must EXTRAPOLATE the product and drape it perfectly onto the model.
- UNSTITCHED MATERIAL: Interpret fabric swatches as elegantly draped or stitched garments (sarees, lehengas, suits) as requested.

MODEL & VIBE:
- Model: Young, beautiful South Asian woman. 
- DIVERSITY: Ensure variety in skin tones (fair, brown, dark).
- Expression: Warm, genuine, engaging smile (NO pouts).
- Makeup: "Soft glam" with an ethereal, radiant finish.

STRICT PHOTOGRAPHY & LIGHTING RULES:
- NO SHADOWS: The images must be SHADOWLESS. The model must not cast any shadow on the background, floor, or herself.
- FRONT ANGLE: Captured from a professional front-facing or slightly angled front perspective.
- NO LOGOS: Absolutely do not include any logos, watermarks, text, or brand symbols.
- NO HARSHNESS: Lighting must be wrap-around and HEAVILY DIFFUSED.

STRICT CONSISTENCY RULES FOR THE SHOOT:
- BACKGROUND: Use the EXACT SAME seamless, soft white studio backdrop for every shot of the product. No variations in background texture, floor appearance, or background lighting are allowed.
- LIGHTING: The lighting setup (high-key, shadowless, ultra-diffused) must remain IDENTICAL across all poses in the series.
- MODEL: The model's identity, features, hairstyle, and accessories must remain IDENTICAL across all poses for the same product.

PHOTOGRAPHY STYLE:
- Backdrop: Pure, seamless, soft white studio backdrop.
- Quality: Ultra-high-resolution, organic, 9:16 vertical portrait format.

PRODUCT INTEGRATION:
- Maintain EXACT design, color, and embroidery patterns.
`;
