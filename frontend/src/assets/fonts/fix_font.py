from pathlib import Path
from fontTools.ttLib import TTFont

BASE_DIR = Path(__file__).resolve().parent

src = BASE_DIR / "dimibang.ttf"
out = BASE_DIR / "dimibang-web.woff2"

font = TTFont(src)

if "kern" in font:
    del font["kern"]

font.flavor = "woff2"
font.save(out)

print(f"완료: {out}")
