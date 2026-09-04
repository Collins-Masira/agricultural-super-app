# app/services/ai_knowledge_base.py

"""
Lightweight agricultural knowledge base used to ground the AI assistant's
answers.

Rather than sending the entire knowledge base on every request (which would
bloat the prompt and hurt cost/latency), the assistant picks the most relevant
subset based on keywords in the user's message and appends it to the system
prompt. This gives the model concrete, curated facts to draw from instead of
relying purely on its training data.

Each entry carries a group of keyword triggers and a body of reliable,
general-educational guidance. This is deliberately general-purpose farm
management knowledge -- it is NOT a substitute for a verified expert on
high-stakes or localised decisions, which the system prompt already steers
users towards.
"""

FOOD_CROP_GUIDANCE = (
    "General crop guidance: rotate crops season to season to break pest and "
    "disease cycles. Test soil before planting; add compost or well-rotted "
    "manure at least two weeks before planting. Correct spacing and timely "
    "weeding typically matter more than extra fertilizer. Water deeply but "
    "less often to encourage deep roots. Watch the underside of leaves for "
    "early pest signs and treat small outbreaks before they spread."
)

MAIZE_GUIDANCE = (
    "Maize guidance: plant when soil is moist and warm. Top-dress with "
    "nitrogen around knee height (staging V6-V8) and again just before "
    "tasselling if growth is poor. Space plants to the recommended density "
    "for your variety. Watch for fall armyworm and stalk borers; scout "
    "whorls early. Harvest at the right moisture and dry grain properly to "
    "prevent aflatoxin."
)

SOIL_GUIDANCE = (
    "Soil health guidance: soil texture, pH, and nutrient levels drive what "
    "a farm can grow. Most smallholder soils benefit from organic matter "
    "(compost, manure, cover crops). Lime raises pH and improves nutrient "
    "availability on acid soils, but only apply the amount a soil test "
    "recommends -- over-liming is as bad as under-liming. Avoid bare soil "
    "between seasons; plant a cover crop to protect structure."
)

PEST_CONTROL_GUIDANCE = (
    "Pest control guidance: use integrated pest management -- scout first, "
    "identify the pest, then act. Favour cultural and physical controls "
    "(crop rotation, resistant varieties, traps, hand-picking) before "
    "chemicals. When a pesticide is needed, choose one registered for the "
    "crop and pest, follow exactly the label rate and re-entry interval, "
    "and wear protective gear. Never guess a dose, and never apply close to "
    "harvest unless the label allows it."
)

FERTILIZER_GUIDANCE = (
    "Fertilizer guidance: apply based on a soil test whenever possible. "
    "Match fertilizer type and timing to the crop's growth stage -- nitrogen "
    "is needed at active growth, phosphorus at establishment and rooting, "
    "potassium for stress tolerance and fruit quality. Split nitrogen "
    "applications to reduce losses. Store fertilizers dry and away from "
    "children and animals."
)

LIVESTOCK_GUIDANCE = (
    "Livestock guidance: keep animals on a consistent feeding and watering "
    "routine. Isolate new or sick animals for observation. Maintain a "
    "vaccination schedule recommended by a local veterinarian. Watch for "
    "changes in appetite, behaviour, coat, or droppings, which often signal "
    "illness early. Provide clean, dry, well-ventilated housing to reduce "
    "disease pressure."
)

CATTLE_GUIDANCE = (
    "Cattle guidance: deworm and vaccinate on a vet-recommended schedule. "
    "Ensure constant access to clean water and minerals. Handle calf "
    "diseases and mastitis early. When dosing medication, use the exact "
    "weight-based dose from the label or your veterinarian -- never guess. "
    "If an animal is off-feed, dull, or has a fever, separate it and consult "
    "a veterinarian promptly."
)

WATER_IRRIGATION_GUIDANCE = (
    "Water and irrigation guidance: match watering to crop stage and soil "
    "type. Watering deeply and less often encourages deeper, drought-"
    "resilient roots. Drip irrigation and mulching conserve moisture. "
    "Collect and store rainwater where possible. Avoid waterlogging, which "
    "can suffocate roots and trigger fungal disease."
)

CLIMATE_WEATHER_GUIDANCE = (
    "Weather guidance: time planting around the start of the rains when soil "
    "is moist, not waterlogged. Have a plan for both excess rain (drainage, "
    "raised beds, disease prevention) and dry spells (mulch, moisture "
    "retention, drought-tolerant varieties). Stagger plantings to spread "
    "weather risk across the season."
)

GUIDANCE_GROUPS = [
    ("maize|corn|top.?dress|knee.?height|armyworm|stalk borer", ("Maize guidance:", MAIZE_GUIDANCE), FOOD_CROP_GUIDANCE),
    ("soil|ph|lime|compost|manure|nutrient|fertilit", ("Soil guidance:", SOIL_GUIDANCE), FOOD_CROP_GUIDANCE),
    ("pest|insect|spray|pesticide|herbicide|fungicide|worm", ("Pest control guidance:", PEST_CONTROL_GUIDANCE), FOOD_CROP_GUIDANCE),
    ("fertiliz|n-\\s*p-\\s*k|n.p.k|npk|urea|nitrogen|phosphor|potassium", ("Fertilizer guidance:", FERTILIZER_GUIDANCE), FOOD_CROP_GUIDANCE),
    ("cattle|cow|livestock|veterinar|mastitis|vaccinat|deworm", ("Cattle/livestock guidance:", CATTLE_GUIDANCE), LIVESTOCK_GUIDANCE),
    ("water|irrigat|drip|mulch|drainage|rainwater|waterlog", ("Water and irrigation guidance:", WATER_IRRIGATION_GUIDANCE), FOOD_CROP_GUIDANCE),
    ("weather|rain|drought|dry.?spell|climate|season", ("Weather guidance:", CLIMATE_WEATHER_GUIDANCE), FOOD_CROP_GUIDANCE),
]

# Well-known crops the assistant has specific curated guidance for; used to
# give a clearer "I don't have specific crop guidance" answer than a generic
# refusal when the crop isn't in the curated set.
KNOWN_CROPS = {"maize", "corn", "avocado", "bean", "soybean", "wheat", "rice", "millet", "sorghum"}


def _crop_in_message(text):
    lowered = " " + text.lower().strip() + " "
    for crop in KNOWN_CROPS:
        if f" {crop} " in lowered or text.lower().startswith(crop + " "):
            return crop
    return None


def grounding_context(user_message):
    """
    Select the most relevant guidance paragraphs based on keywords in the
    user's latest message. Returns a single string block (or an empty string
    if nothing matches), ready to append to the system prompt.
    """
    lowered = user_message.lower()
    selected = []
    seen = set()

    for keywords, (label, body), *generic in GUIDANCE_GROUPS:
        if any(k in lowered for k in keywords.split("|")):
            if body not in seen:
                seen.add(body)
                selected.append(f"{label}\n{body}")

    if not selected:
        # No specific guidance matched; provide general crop/livestock framing
        # so the model still has something concrete to ground on.
        return FOOD_CROP_GUIDANCE

    return "\n\n".join(selected)
