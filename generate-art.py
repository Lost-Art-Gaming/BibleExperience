import os
import subprocess
import urllib.parse
from pathlib import Path

ASSETS = {
    "hero-origins.webp": "cinematic biblical landscape at dawn, ancient Near East valley, river winding through mountains, lone robed traveler seen from behind on a ridge, historically inspired, photorealistic, epic film still, natural warm sunlight, deep navy shadows, no text, no typography, premium visual for a mobile Bible app",
    "ep1-beginning.webp": "Genesis creation, cosmic dawn breaking over a newly formed earth, radiant light over mountains and oceans, majestic and reverent, photorealistic cinematic biblical art, no people, no text, premium film still",
    "ep2-eden.webp": "Garden of Eden, lush ancient garden with waterfalls, diverse vegetation, Adam and Eve seen from behind, modest historically inspired linen garments, serene radiant light, photorealistic cinematic biblical art, no text",
    "ep3-serpent-seed.webp": "biblical Eden scene after temptation, a serpent coiled around an ancient tree with red fruit, Eve in the foreground looking troubled, dramatic shafts of light and shadow, reverent photorealistic cinematic art, no nudity, no text",
    "ep4-east-eden.webp": "Cain and Abel in the ancient Near East, two brothers near an altar at sunset, tense emotional atmosphere, historically inspired clothing and landscape, cinematic photorealism, no text",
    "ep5-adam-story.webp": "ancient man walking through a vast landscape at golden hour, family camp and generations in the distance, biblical Near East, contemplative, photorealistic cinematic film still, no text",
    "ep6-noah.webp": "Noah standing beside the enormous wooden ark before the flood, animals approaching in pairs, dark storm clouds gathering, ancient Near East, dramatic cinematic lighting, photorealistic, reverent, no text",
    "ep7-deluge.webp": "the great flood, massive wooden ark riding violent ancient waters under towering storm clouds and lightning, cinematic scale, photorealistic biblical art, reverent, no text",
    "ep8-bow.webp": "rainbow covenant after the flood, Noah and family standing on a green mountain valley overlooking calm waters, radiant sunlight through clouds, cinematic photorealism, reverent, no text",
    "ep9-babel.webp": "Tower of Babel rising above an ancient Mesopotamian city, workers and crowds below, monumental mud-brick architecture, warm sunset, cinematic photorealism, historically inspired, no text",
    "ep10-abraham.webp": "Abraham beginning his journey from Haran, elderly bearded man in historically inspired robes looking toward distant Canaan mountains, family and camels behind him, sunrise, cinematic photorealism, reverent, no text",
    "map-exodus.webp": "antique illustrated map of the ancient Near East showing Egypt, Sinai, Canaan and the Red Sea, parchment texture, hand-painted cartography, premium museum-quality map, no modern borders",
    "library-manuscript.webp": "ancient study room with illuminated oil lamps, open Hebrew manuscript scrolls, wooden table, stone architecture, warm candlelight, cinematic photorealism, scholarly and reverent, no modern objects, no text",
}

OUT = Path("assets")
OUT.mkdir(exist_ok=True)

for filename, prompt in ASSETS.items():
    out = OUT / filename
    if out.exists() and out.stat().st_size > 10000:
        continue

    encoded = urllib.parse.quote(prompt)
    key = os.getenv("POLLINATIONS_API_KEY", "")
    if key:
        url = f"https://gen.pollinations.ai/image/{encoded}?model=flux&width=1024&height=1024&enhance=true&nologo=true&key={key}"
    else:
        url = f"https://image.pollinations.ai/prompt/{encoded}?model=flux&width=1024&height=1024&nologo=true&enhance=true"

    subprocess.run(["curl", "-L", "--fail", "--retry", "3", "-o", str(out), url], check=True)

print(f"Generated {len(ASSETS)} premium Bible Experience art assets")
