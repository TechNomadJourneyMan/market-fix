"""
Market Fix — Data Source.

Два режима получения данных о заведениях:
  1. "built_in"  — встроенная база из venues_data.py (без подключения к БД).
  2. "api"       — данные из Supabase (таблица venues).

Режим выбирается в боковой панели. Если api-режим недоступен
(нет supabase-py / нет соединения / нет переменных окружения),
приложение автоматически откатывается к built_in.
"""

from __future__ import annotations

import os
from typing import Any

import streamlit as st

from venues_data import get_venues

# --------------------------------------------------------------------------- #
# Конфигурация Supabase (значения передаются через Streamlit secrets или env).
# --------------------------------------------------------------------------- #

SUPABASE_URL = os.environ.get(
    "NEXT_PUBLIC_SUPABASE_URL",
    st.secrets.get("supabase", {}).get("url", "") if hasattr(st, "secrets") else "",
)
SUPABASE_KEY = os.environ.get(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    st.secrets.get("supabase", {}).get("key", "") if hasattr(st, "secrets") else "",
)


def supabase_available() -> bool:
    """Проверить, можно ли использовать API-режим."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    try:
        import supabase  # noqa: F401
        return True
    except Exception:
        return False


@st.cache_data(ttl=300, show_spinner=False)
def _fetch_from_supabase() -> list[dict[str, Any]]:
    """Загрузить заведения из таблицы venues в Supabase."""
    from supabase import create_client

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    resp = client.table("venues").select("*").order("ai_score", desc=True).execute()
    rows = resp.data or []

    # Нормализуем ключи из snake_case БД к единому виду UI.
    venues: list[dict[str, Any]] = []
    for r in rows:
        v = dict(r)
        # scenario_scores могут храниться как JSONB-колонка или отдельной таблицей.
        if "scenarios" not in v and "scenario_scores" in v:
            v["scenarios"] = v["scenario_scores"]
        venues.append(v)
    return venues


def _fetch_builtin() -> list[dict[str, Any]]:
    """Вернуть встроенную базу заведений."""
    return get_venues()


def get_all_venues(mode: str = "built_in") -> list[dict[str, Any]]:
    """
    Получить все заведения в выбранном режиме.

    mode:
        "built_in" — встроенная база;
        "api"      — Supabase (с откатом к built_in при ошибке).
    """
    if mode == "api" and supabase_available():
        try:
            return _fetch_from_supabase()
        except Exception as exc:  # pragma: no cover
            st.toast(f"API-режим недоступен: {exc}. Переключаюсь на built-in.", icon="⚠️")
            return _fetch_builtin()
    return _fetch_builtin()


def data_source_label(mode: str) -> str:
    """Человекочитаемая метка источника данных."""
    if mode == "api" and supabase_available():
        return "Supabase API ✓"
    if mode == "api":
        return "Supabase API (недоступен) ⚠️"
    return "Built-in (встроенная база)"
