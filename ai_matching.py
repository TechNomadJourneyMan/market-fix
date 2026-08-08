"""
Market Fix — AI Matching Engine.

Подбирает заведения под запрос пользователя на основе:
  - ключевых слов (цена, кухня, район, атмосфера, сценарий, инфраструктура);
  - оценок сценариев 0–5 (scenario_scores);
  - AI score из 100-балльной системы.

Формула финального балла подбора (0–100):
    match = 0.55 * scenario_fit   (0–5 → 0–100)
          + 0.25 * ai_score        (0–100)
          + 0.20 * keyword_bonus   (0–100)

scenario_fit   — насколько сценарии заведения совпадают с запросом.
ai_score       — предварительная оценка ценности для marketplace.
keyword_bonus  — совпадение по цене/кухне/атмосфере/инфраструктуре.
"""

from __future__ import annotations

import re
from typing import Any, Iterable

from venues_data import SCENARIO_KEYS, VENUES, get_venues

# --------------------------------------------------------------------------- #
# Словари синонимов для разбора запроса на русском и английском.
# --------------------------------------------------------------------------- #

SCENARIO_SYNONYMS: dict[str, list[str]] = {
    "date": [
        "свидание", "свидании", "романтик", "романтич", "девушк", "любим",
        "уютн", "двоём", "двое", "для двоих", "date", "romantic",
    ],
    "family": [
        "семейн", "семьёй", "семь", "с семьёй", "детьми", "детей", "с ребёнк",
        "семе", "family",
    ],
    "business": [
        "делов", "бизнес", "переговор", "партнёр", "коллег", "business",
        "meeting", "встреча с партнёр",
    ],
    "friends": [
        "друзьями", "друзья", "друг", "компани", "дружеск", "с друзьями",
        "friends", "hang out",
    ],
    "birthday": [
        "день рожден", "дня рожден", "дню рожден", "др ", "birthday",
    ],
    "banquet": [
        "банкет", "banquet", "торжеств",
    ],
    "corporate": [
        "корпоратив", "company event", "corporate",
    ],
    "tourist": [
        "турист", "гостю", "гость города", "иностранец", "туристическ",
        "tourist", "visitor",
    ],
    "laptop": [
        "ноутбук", "поработать", "работа с ноутбуком", "wifi", "wi-fi",
        "wi fi", "коворкинг", "remote work", "laptop", "work",
    ],
    "large_group": [
        "большая компания", "большой компанией", "большой компани",
        "много человек", "толпой", "компанией человек", "large group",
        "big group",
    ],
}

CUISINE_SYNONYMS: dict[str, list[str]] = {
    "Казахская": ["казахск", "бешбармак", "национальн", "казах"],
    "Центральноазиатская": ["узбекск", "плов", "лагман", "манты", "центральноазиатск", "восточн"],
    "Грузинская": ["грузинск", "хачапур", "хинкал", "шашлык"],
    "Итальянская": ["итальянск", "паста", "пицц", "итал"],
    "Японская": ["японск", "суши", "роллы", "рамен", "рамэн", "изакая", "япон"],
    "Морепродукты": ["морепродукт", "рыба", "seafood", "креветк", "лобстер", "устриц"],
    "Европейская": ["европейск", "европ"],
    "Турецкая": ["турецк", "кебаб", "тур"],
    "Индийская": ["индийск", "карри", "наан", "спайс"],
    "Стейки": ["стейк", "мясо", "стeйкхаус", "steakhouse", "гриль"],
    "Бургеры": ["бургер", "бург"],
    "Коктейли": ["коктейл", "бар", "bar", "cocktail"],
    "Кофе": ["кофе", "кофейн", "латте", "капучино", "еспрессо"],
}

ATMOSPHERE_SYNONYMS: dict[str, list[str]] = {
    "Тихая": ["тих", "спокойн", "тихая", "тихий"],
    "Романтичная": ["романтич"],
    "Премиальная": ["премиальн", "премиум", "люкс", "дорог", "VIP"],
    "Семейная": ["семейн", "уютн"],
    "Шумное": ["шумн", "тусовочн", "весело", "громк"],
    "С видом": ["вид", "панорам", "на город", "на горы", "с террасой"],
    "Современное": ["современ", "тренд", "модн"],
}

PRICE_SYNONYMS: dict[str, list[str]] = {
    "budget": ["дёшево", "дешево", "бюджетн", "недорого", "дешев", "budget", "cheap"],
    "budget_mid": ["демократич", "доступн"],
    "mid": ["средн", "средний", "middle", "mid"],
    "upper_mid": ["средний плюс", "средний+", "upper mid"],
    "premium": ["премиальн", "премиум", "дорог", "дорого", "premium", "luxury"],
    "luxury": ["люкс", "роскош", "fine dining", "fine-dining", "luxury"],
}

# Порог среднего чека (₸) для сегментов (для текстовых запросов с бюджетом).
PRICE_BUDGETS = {
    "budget": (0, 5000),
    "budget_mid": (3000, 8000),
    "mid": (6000, 15000),
    "upper_mid": (12000, 25000),
    "premium": (20000, 50000),
    "luxury": (40000, 1_000_000),
}

AMENITY_SYNONYMS: dict[str, list[str]] = {
    "terrace": ["террас", "веранд", "на улице", "открыт", "outdoor", "terrace"],
    "parking": ["парковк", "парк", " parking", "для машины", "на машине"],
    "wifi": ["wifi", "wi-fi", "wi fi", "интернет", "wi‑fi"],
    "kids_room": ["детская комната", "детям", "с детьми"],
    "vip_room": ["vip", "отдельный зал", "приватн"],
    "live_music": ["живая музыка", "live music", "музыка"],
    "breakfast": ["завтрак", "breakfast"],
    "brunch": ["brunch", "бранч"],
    "delivery": ["доставк", "delivery"],
    "business_lunch": ["бизнес-ланч", "бизнес ланч", "ланч"],
}

# --------------------------------------------------------------------------- #
# Парсинг запроса.
# --------------------------------------------------------------------------- #


def _norm(text: str) -> str:
    return text.lower().replace("ё", "е")


def _extract_scenarios(query: str) -> list[str]:
    q = _norm(query)
    found: list[str] = []
    for key, words in SCENARIO_SYNONYMS.items():
        if any(w in q for w in words):
            found.append(key)
    return found


def _extract_cuisines(query: str) -> list[str]:
    q = _norm(query)
    found: list[str] = []
    for key, words in CUISINE_SYNONYMS.items():
        if any(w in q for w in words):
            found.append(key)
    return found


def _extract_atmosphere(query: str) -> list[str]:
    q = _norm(query)
    found: list[str] = []
    for key, words in ATMOSPHERE_SYNONYMS.items():
        if any(w in q for w in words):
            found.append(key)
    return found


def _extract_price(query: str) -> str | None:
    q = _norm(query)
    # Сначала ищем прямые сигналы слов.
    for key, words in PRICE_SYNONYMS.items():
        if any(w in q for w in words):
            return key
    # Затем — числовой бюджет «до N NNN ₸».
    nums = re.findall(r"(\d[\d\s]*)\s*₸?", q)
    for raw in nums:
        n = int(re.sub(r"\D", "", raw))
        if 1000 <= n <= 100000:
            for seg, (lo, hi) in PRICE_BUDGETS.items():
                if lo <= n <= hi:
                    return seg
    return None


def _extract_budget_amount(query: str) -> int | None:
    q = _norm(query)
    nums = re.findall(r"(\d[\d\s]*)\s*₸?", q)
    for raw in nums:
        n = int(re.sub(r"\D", "", raw))
        if 1000 <= n <= 100000:
            return n
    return None


def _extract_amenities(query: str) -> list[str]:
    q = _norm(query)
    found: list[str] = []
    for key, words in AMENITY_SYNONYMS.items():
        if any(w in q for w in words):
            found.append(key)
    return found


def _extract_district(query: str) -> str | None:
    q = _norm(query)
    districts = {
        "Алмалинский": ["алмалинск", "алмалин"],
        "Медеуский": ["медеуск", "медеу"],
        "Бостандыкский": ["бостандыкск", "бостандык"],
        "Жетысуский": ["жетысуск", "жетесу"],
        "Ауэзовский": ["ауэзовск", "ауэзов"],
        "Турксибский": ["турксибск", "турксиб"],
        "Наурызбайский": ["наурызбайск", "наурызбай"],
        "Алатауский": ["алатауск", "алатау"],
    }
    for district, words in districts.items():
        if any(w in q for w in words):
            return district
    return None


def parse_query(query: str) -> dict[str, Any]:
    """Разобрать пользовательский запрос в структурированные параметры."""
    return {
        "scenarios": _extract_scenarios(query),
        "cuisines": _extract_cuisines(query),
        "atmosphere": _extract_atmosphere(query),
        "price": _extract_price(query),
        "budget": _extract_budget_amount(query),
        "amenities": _extract_amenities(query),
        "district": _extract_district(query),
    }


# --------------------------------------------------------------------------- #
# Расчёт match score.
# --------------------------------------------------------------------------- #


def _scenario_score(venue: dict[str, Any], scenarios: list[str]) -> float:
    """Средняя оценка по запрошенным сценариям (0–5)."""
    if not scenarios:
        # Если сценарий не указан — берём максимальный сценарий заведения.
        sc = venue.get("scenarios", {}) or {}
        return max(sc.values()) if sc else 0
    scores = venue.get("scenarios", {}) or {}
    vals = [scores.get(s, 0) for s in scenarios]
    return sum(vals) / len(vals) if vals else 0


def _keyword_bonus(
    venue: dict[str, Any],
    cuisines: list[str],
    atmosphere: list[str],
    price: str | None,
    amenities: list[str],
    district: str | None,
) -> float:
    bonus = 0.0
    total = 0.0

    if cuisines:
        total += 1
        vcuisines = [c.lower() for c in (venue.get("cuisines") or [])]
        matches = sum(1 for c in cuisines if c.lower() in vcuisines)
        bonus += matches / len(cuisines) if cuisines else 0

    if atmosphere:
        total += 1
        vatm = [a.lower() for a in (venue.get("atmosphere") or [])]
        matches = sum(1 for a in atmosphere if a.lower() in vatm)
        bonus += matches / len(atmosphere) if atmosphere else 0

    if price:
        total += 1
        if venue.get("price_segment", "").lower().replace("-", "_") == price:
            bonus += 1.0
        elif price == "premium" and venue.get("price_segment", "").lower() in ("premium", "luxury"):
            bonus += 0.75
        elif price in ("budget", "budget_mid") and venue.get("price_segment", "").lower() in ("budget", "budget_mid"):
            bonus += 0.75
        elif price == "mid" and venue.get("price_segment", "").lower() in ("mid", "budget_mid"):
            bonus += 0.5

    if amenities:
        total += 1
        hits = 0
        for a in amenities:
            if venue.get(a):
                hits += 1
        bonus += hits / len(amenities) if amenities else 0

    if district:
        total += 1
        if venue.get("district") == district:
            bonus += 1.0

    if total == 0:
        return 50.0  # нейтральный бонус, если запрос пустой
    return (bonus / total) * 100.0


def match_venues(
    query: str,
    venues: list[dict[str, Any]] | None = None,
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """
    Подобрать заведения под текстовый запрос.

    Возвращает топ-N заведений с полями:
        venue, match_score (0–100), reasons (список объяснений).
    """
    venues = venues if venues is not None else get_venues()
    params = parse_query(query)

    results: list[dict[str, Any]] = []
    for v in venues:
        scenario_fit = _scenario_score(v, params["scenarios"])  # 0–5
        scenario_pct = (scenario_fit / 5.0) * 100.0
        ai = v.get("ai_score", 0) or 0
        kb = _keyword_bonus(
            v, params["cuisines"], params["atmosphere"],
            params["price"], params["amenities"], params["district"],
        )

        score = 0.55 * scenario_pct + 0.25 * ai + 0.20 * kb
        score = round(score, 1)

        reasons = _explain(v, params, scenario_fit)
        results.append({"venue": v, "match_score": score, "reasons": reasons})

    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results[:top_n]


def _explain(venue: dict[str, Any], params: dict[str, Any], scenario_fit: float) -> list[str]:
    """Сформировать человекочитаемые причины выбора."""
    reasons: list[str] = []

    if params["scenarios"] and scenario_fit >= 4:
        from venues_data import SCENARIO_LABELS
        labels = [SCENARIO_LABELS.get(s, s) for s in params["scenarios"]]
        reasons.append(f"Отлично подходит для: {', '.join(labels)} "
                       f"(оценка {scenario_fit:.1f}/5)")
    elif params["scenarios"] and scenario_fit >= 3:
        from venues_data import SCENARIO_LABELS
        labels = [SCENARIO_LABELS.get(s, s) for s in params["scenarios"]]
        reasons.append(f"Хорошо подходит для: {', '.join(labels)}")

    if params["cuisines"]:
        vcuisines = [c.lower() for c in (venue.get("cuisines") or [])]
        matched = [c for c in params["cuisines"] if c.lower() in vcuisines]
        if matched:
            reasons.append(f"Кухня: {', '.join(matched)}")

    if params["price"] and venue.get("price_segment"):
        reasons.append(f"Ценовой сегмент: {venue['price_segment']}")

    if params["amenities"]:
        present = [a for a in params["amenities"] if venue.get(a)]
        if present:
            am_labels = {
                "terrace": "терраса", "parking": "парковка", "wifi": "Wi-Fi",
                "kids_room": "детская комната", "vip_room": "VIP-зал",
                "live_music": "живая музыка", "breakfast": "завтраки",
                "brunch": "brunch", "delivery": "доставка",
                "business_lunch": "бизнес-ланч",
            }
            labels = [am_labels.get(a, a) for a in present]
            reasons.append(f"Инфраструктура: {', '.join(labels)}")

    if venue.get("ai_score", 0) >= 80:
        reasons.append(f"Высокий AI score: {venue['ai_score']}/100")

    if not reasons:
        reasons.append("Популярное заведение из каталога Market Fix")

    return reasons[:4]


def filter_venues(
    venues: list[dict[str, Any]],
    *,
    categories: str | list[str] | None = None,
    category: str | list[str] | None = None,
    price_segments: list[str] | None = None,
    cuisines: list[str] | None = None,
    districts: str | list[str] | None = None,
    district: str | list[str] | None = None,
    min_ai_score: int | None = None,
    amenities: dict[str, bool] | None = None,
    scenario: str | None = None,
    min_scenario_score: int = 3,
    booking_only: bool = False,
) -> list[dict[str, Any]]:
    """Применить набор фильтров к списку заведений (для каталога)."""
    cat_filter = categories or category
    dist_filter = districts or district

    if isinstance(cat_filter, str):
        cat_filter = [cat_filter]
    if isinstance(dist_filter, str):
        dist_filter = [dist_filter]

    out: list[dict[str, Any]] = []
    for v in venues:
        if cat_filter and v.get("category") not in cat_filter:
            continue
        if price_segments and v.get("price_segment") not in price_segments:
            continue
        if cuisines:
            vcuisines = [c.lower() for c in (v.get("cuisines") or [])]
            if not any(c.lower() in vcuisines for c in cuisines):
                continue
        if dist_filter and v.get("district") not in dist_filter:
            continue
        if min_ai_score is not None and (v.get("ai_score") or 0) < min_ai_score:
            continue
        if booking_only and not v.get("booking_available"):
            continue
        if amenities:
            ok = True
            for key, required in amenities.items():
                if required and not v.get(key):
                    ok = False
                    break
            if not ok:
                continue
        if scenario:
            sc = (v.get("scenarios") or {}).get(scenario, 0)
            if sc < min_scenario_score:
                continue
        out.append(v)
    return out


# Доступные значения для UI-фильтров.
ALL_CUISINES = sorted({
    c for v in VENUES for c in (v.get("cuisines") or [])
})
ALL_DISTRICTS = sorted({
    v["district"] for v in VENUES if v.get("district") and v["district"] != "Не найдено"
})
ALL_CATEGORIES = sorted({v["category"] for v in VENUES if v.get("category")})
PRICE_SEGMENTS = ["budget", "budget_mid", "mid", "upper_mid", "premium", "luxury"]
