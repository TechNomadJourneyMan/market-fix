"""
Market Fix — Генератор seed-данных для Supabase.

Конвертирует встроенную базу venues_data.py в SQL-инсерты,
которые можно выполнить в Supabase SQL Editor для наполнения таблицы venues.

Запуск:
    python seed_supabase.py

Результат: supabase/seed.sql
"""

from __future__ import annotations

import json
from pathlib import Path

from venues_data import SCENARIO_KEYS, VENUES


def _sql_val(value) -> str:
    """Преобразовать Python-значение в SQL-литерал."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (list, tuple)):
        items = ", ".join(_sql_val(x) for x in value)
        return f"ARRAY[{items}]"
    # строка
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def generate_seed_sql() -> str:
    lines: list[str] = []
    lines.append("-- Market Fix — seed data (50 заведений Алматы)")
    lines.append("-- Сгенерировано из venues_data.py")
    lines.append("")
    lines.append("truncate table public.venues cascade;")
    lines.append("")

    cols = [
        "venue_id", "name", "category", "subcategory", "cuisines",
        "price_segment", "average_check", "district", "address",
        "phone", "website", "instagram", "two_gis_url", "google_maps_url",
        "tripadvisor_url", "menu_url", "booking_url",
        "booking_available", "booking_method",
        "working_hours", "capacity",
        "wifi", "parking", "free_parking", "terrace", "vip_room",
        "kids_room", "kids_menu", "live_music", "wine_card",
        "breakfast", "brunch", "business_lunch", "delivery", "takeaway",
        "vegetarian", "vegan", "halal", "banquet_available",
        "rating_2gis", "reviews_2gis", "rating_google", "reviews_google",
        "atmosphere", "best_for", "scenarios", "pros", "cons",
        "ai_score", "confidence", "popularity_level", "data_completeness",
        "verification_status", "last_verified_at", "source_urls",
    ]

    for v in VENUES:
        scenarios = {k: (v.get("scenarios") or {}).get(k, 0) for k in SCENARIO_KEYS}
        values = []
        for c in cols:
            if c == "scenarios":
                values.append(_sql_val(json.dumps(scenarios, ensure_ascii=False)))
            else:
                values.append(_sql_val(v.get(c)))
        col_list = ", ".join(cols)
        val_list = ", ".join(values)
        lines.append(f"insert into public.venues ({col_list})")
        lines.append(f"values ({val_list});")
        lines.append("")

    # scenario_scores
    lines.append("-- scenario_scores")
    lines.append("truncate table public.scenario_scores;")
    for v in VENUES:
        sc = v.get("scenarios") or {}
        for key in SCENARIO_KEYS:
            score = sc.get(key, 0)
            lines.append(
                f"insert into public.scenario_scores (venue_id, scenario_name, score) "
                f"values ({_sql_val(v['venue_id'])}, '{key}', {int(score)}) "
                f"on conflict (venue_id, scenario_name) do update set score = excluded.score;"
            )
    lines.append("")
    lines.append(f"-- Всего заведений: {len(VENUES)}")
    return "\n".join(lines)


def main() -> None:
    out = Path(__file__).parent / "supabase" / "seed.sql"
    out.parent.mkdir(parents=True, exist_ok=True)
    sql = generate_seed_sql()
    out.write_text(sql, encoding="utf-8")
    print(f"✓ Seed SQL записан в {out} ({len(VENUES)} заведений)")


if __name__ == "__main__":
    main()
