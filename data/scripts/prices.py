# Adds retail prices to data/components.json. Run once by hand; nothing fetches at runtime.
#   python3 data/scripts/prices.py pp_national_average_prices_csv.csv data/components.json
# Source: USDA ERS Purchase to Plate National Average Prices (PP-NAP), 2017/2018 series, price per 100 edible grams
#   https://www.ers.usda.gov/data-products/purchase-to-plate  (CSV zip, last updated 2023-03-08)
# Brought to December 2024 (the month before the demo date, 2025-01-14) with BLS CPI-U Food at home,
# U.S. city average, not seasonally adjusted, series CUUR0000SAF11: 2017 annual 238.589, 2018 annual 239.661, Dec 2024 308.380.
import csv, json, sys

src, path = sys.argv[1], sys.argv[2]
CPI_BASE = (238.589 + 239.661) / 2
CPI_DEC_2024 = 308.380
FACTOR = CPI_DEC_2024 / CPI_BASE

# component id -> PP-NAP 2017/2018 food_code, the FNDDS food closest to the SR Legacy food in components.json
CODE = {
    "white-rice": 56205008, "brown-rice": 56205011, "black-beans": 41102020, "red-beans": 41106020,
    "pinto-beans": 41104020, "chickpeas": 41302020, "lentils": 41305000, "chicken-breast": 24122131,
    "chicken-thigh": 24152231, "ground-beef": 21500100, "steak": 21101120, "pork-loin": 22401010,
    "salmon": 26137123, "white-fish": 26158013, "shrimp": 26319130, "egg": 31103010, "egg-fried": 31105030,
    "plantain-ripe-fried": 71900200, "plantain-green-fried": 71900200, "plantain-boiled": 71900100,
    "yuca": 71930120, "potato": 71508001, "sweet-potato": 73402010, "french-fries": 71401032,
    "broccoli": 72201211, "mixed-vegetables": 75311012, "lettuce": 72116000, "tomato": 74101000,
    "avocado": 63105010, "corn": 75216111, "white-bread": 51101000, "burger-bun": 51154100,
    "corn-tortilla": 52215100, "pasta": 56130000, "quinoa": 56204005, "oatmeal": 56203056,
    "cheddar": 14104100, "queso-fresco": 14133000, "milk": 11111000, "olive-oil": 82104000,
    "butter": 81101000, "sugar": 91101010,
}

rows = {int(r["food_code"]): r for r in csv.DictReader(open(src, encoding="cp1252")) if r["year"] == "2017/2018" and r["food_code"].isdigit()}
data = json.load(open(path))
data["price_source"] = {
    "name": "USDA ERS Purchase to Plate National Average Prices (PP-NAP), 2017/2018 series, price per 100 edible grams",
    "url": "https://www.ers.usda.gov/data-products/purchase-to-plate",
    "file": "purchase-to-plate-national-average-prices-for-nhanes-csv-format.zip, last updated 2023-03-08",
    "adjusted_with": {
        "name": "BLS CPI-U, Food at home, U.S. city average, not seasonally adjusted",
        "series": "CUUR0000SAF11",
        "url": "https://data.bls.gov/timeseries/CUUR0000SAF11",
        "base": "2017-2018 annual average", "base_index": round(CPI_BASE, 3),
        "month": "2024-12", "index": CPI_DEC_2024, "factor": round(FACTOR, 4),
    },
    "month": "2024-12",
    "retrieved": "2026-10-17",
}
for c in data["components"]:
    code = CODE.get(c["id"])
    r = rows.get(code)
    if not r:
        print("UNPRICED", c["id"])
        continue
    raw = float(r["price_100gm"])
    c["usd_per_100g"] = round(raw * FACTOR, 3)
    c["price"] = {"source": "pp-nap-2017-18", "month": "2024-12", "food_code": code,
                  "food": r["food_description"], "usd_per_100g_2017_18": raw}
json.dump(data, open(path, "w"), indent=1, ensure_ascii=False)
print("priced", sum("usd_per_100g" in c for c in data["components"]), "of", len(data["components"]), "factor", round(FACTOR, 4))
