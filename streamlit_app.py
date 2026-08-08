"""
Market Fix — AI Marketplace заведений Алматы.

Главное приложение Streamlit.
Стартовый экран — AI-подбор (чат). Дополнительно: каталог с умными фильтрами,
детальные карточки заведений и аналитика рынка.

Два режима данных:
  • API      — Supabase (таблица venues);
  • Built-in — встроенная база из 50 заведений (venues_data.py).

Дата актуальности данных: 8 августа 2026 года.
"""

from __future__ import annotations

import streamlit as st

from ai_matching import (
    ALL_CATEGORIES,
    ALL_CUISINES,
    ALL_DISTRICTS,
    PRICE_SEGMENTS,
    filter_venues,
    match_venues,
    parse_query,
)
from data_source import data_source_label, get_all_venues, supabase_available
from venues_data import LAST_VERIFIED_AT, SCENARIO_LABELS

# --------------------------------------------------------------------------- #
# Конфигурация страницы и глобальные стили.
# --------------------------------------------------------------------------- #

st.set_page_config(
    page_title="Market Fix — AI Marketplace Алматы",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded",
)

BRAND = "Market Fix"
TAGLINE = "AI Marketplace заведений Алматы"

CUSTOM_CSS = """
<style>
    /* Брендинг Market Fix */
    .mf-brand-title {
        font-size: 2.1rem;
        font-weight: 800;
        background: linear-gradient(90deg, #6366f1 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1.1;
        margin: 0;
    }
    .mf-brand-tagline {
        color: #6b7280;
        font-size: 0.95rem;
        margin: 0;
    }
    .mf-logo-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 6px 0 14px 0;
    }
    .mf-logo-row img {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        object-fit: cover;
        box-shadow: 0 4px 14px rgba(99,102,241,0.25);
    }
    /* Карточки заведений */
    .mf-venue-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 18px 20px;
        margin-bottom: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        transition: box-shadow .2s;
    }
    .mf-venue-card:hover {
        box-shadow: 0 6px 20px rgba(99,102,241,0.12);
    }
    .mf-venue-name {
        font-size: 1.2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 4px 0;
    }
    .mf-venue-meta {
        color: #6b7280;
        font-size: 0.88rem;
        margin: 0 0 8px 0;
    }
    .mf-score-badge {
        display: inline-block;
        background: linear-gradient(90deg, #6366f1 0%, #ec4899 100%);
        color: white;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 4px 12px;
        border-radius: 999px;
    }
    .mf-tag {
        display: inline-block;
        background: #eef2ff;
        color: #4338ca;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 999px;
        margin: 2px 4px 2px 0;
    }
    .mf-reason {
        color: #374151;
        font-size: 0.9rem;
        margin: 3px 0;
    }
    .mf-reason::before { content: "✓ "; color: #10b981; font-weight: 700; }
    .mf-chat-bubble {
        background: #f3f4f6;
        border-radius: 14px;
        padding: 14px 18px;
        margin-bottom: 10px;
    }
    .mf-hero {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
        border-radius: 20px;
        padding: 30px 34px;
        color: white;
        margin-bottom: 24px;
    }
    .mf-hero h1 { color: white; margin: 0; font-size: 1.8rem; }
    .mf-hero p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 1.05rem; }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# --------------------------------------------------------------------------- #
# Утилиты UI.
# --------------------------------------------------------------------------- #


def render_logo_header() -> None:
    """Шапка с логотипом Market Fix."""
    logo_html = ""
    try:
        st.image("assets/logo.png", width=56)
    except Exception:
        pass
    st.markdown(
        f"""
        <div class="mf-logo-row">
            <div>
                <div class="mf-brand-title">{BRAND}</div>
                <div class="mf-brand-tagline">{TAGLINE}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def price_segment_label(seg: str) -> str:
    return {
        "budget": "Бюджетный",
        "budget_mid": "Демократичный",
        "mid": "Средний",
        "upper_mid": "Средний+",
        "premium": "Премиум",
        "luxury": "Luxury",
    }.get(seg, seg or "—")


def price_segment_color(seg: str) -> str:
    return {
        "budget": "#10b981",
        "budget_mid": "#22c55e",
        "mid": "#3b82f6",
        "upper_mid": "#8b5cf6",
        "premium": "#ec4899",
        "luxury": "#f43f5e",
    }.get(seg, "#6b7280")


def format_check(amount) -> str:
    if amount is None:
        return "—"
    return f"{amount:,} ₸".replace(",", " ")


def tags_html(venue: dict) -> str:
    tags = []
    for c in (venue.get("cuisines") or [])[:3]:
        tags.append(f'<span class="mf-tag">{c}</span>')
    for a in (venue.get("atmosphere") or [])[:2]:
        tags.append(f'<span class="mf-tag">{a}</span>')
    return "".join(tags)


# --------------------------------------------------------------------------- #
# Инициализация состояния.
# --------------------------------------------------------------------------- #


def init_state() -> str:
    """Инициализировать режим данных и вернуть его."""
    if "data_mode" not in st.session_state:
        st.session_state.data_mode = "built_in"
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "last_results" not in st.session_state:
        st.session_state.last_results = []
    return st.session_state.data_mode


# --------------------------------------------------------------------------- #
# Сайдбар.
# --------------------------------------------------------------------------- #


def render_sidebar() -> str:
    """Боковая панель: переключатель режима, навигация, источники."""
    with st.sidebar:
        render_logo_header()
        st.markdown("---")

        st.subheader("⚙️ Режим данных")
        api_ok = supabase_available()
        mode = st.radio(
            "Источник данных",
            options=["built_in", "api"],
            format_func=lambda m: "🔌 API (Supabase)" if m == "api" else "📦 Built-in (50 заведений)",
            index=0 if st.session_state.get("data_mode", "built_in") == "built_in" else 1,
            help="API — данные из Supabase; Built-in — встроенная база без подключения.",
            disabled=False,
        )
        if mode == "api" and not api_ok:
            st.warning("Supabase недоступен. Проверьте переменные окружения или файл .env.")
        st.session_state.data_mode = mode
        st.caption(f"Активный источник: **{data_source_label(mode)}**")

        st.markdown("---")
        st.subheader("🧭 Навигация")
        page = st.selectbox(
            "Раздел",
            options=["ai", "catalog", "analytics"],
            format_func=lambda p: {
                "ai": "🤖 AI-подбор",
                "catalog": "🍽️ Каталог заведений",
                "analytics": "📊 Аналитика рынка",
            }[p],
            key="nav_page",
        )
        st.session_state.page = page

        st.markdown("---")
        st.caption(f"📅 Данные актуальны на: **{LAST_VERIFIED_AT}**")
        st.caption("🌐 Источники: 2ГИС, Tripadvisor, Restolife, Restoran.kz")

    return st.session_state.page


# --------------------------------------------------------------------------- #
# Страница: AI-подбор.
# --------------------------------------------------------------------------- #


EXAMPLE_QUERIES = [
    "Нужно уютное место для свидания на двоих, до 20 000 ₸, с парковкой и хорошими десертами",
    "Грузинский ресторан для семьи с детьми, средний чек",
    "Коктейльный бар для встречи с друзьями, премиум",
    "Национальная казахская кухня для туриста",
    "Где поработать с ноутбуком, чтобы был Wi-Fi и кофе",
    "Банкет на большую компанию, узбекская кухня",
    "Завтрак и кофе, тихо и уютно",
    "Вегетарианский ужин, индийская кухня",
]


def render_ai_page() -> None:
    """Главная страница: AI-чат рекомендатель."""
    st.markdown(
        f"""
        <div class="mf-hero">
            <h1>🤖 AI-подбор заведения мечты</h1>
            <p>Опишите, что ищете — на русском или английском. AI подберёт лучшие заведения Алматы
            под ваш сценарий, бюджет, кухню и атмосферу.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Кнопки-примеры.
    st.markdown("**💡 Попробуйте пример:**")
    cols = st.columns(4)
    for i, q in enumerate(EXAMPLE_QUERIES):
        with cols[i % 4]:
            if st.button(q, key=f"ex_{i}", help="Нажмите, чтобы подставить пример"):
                st.session_state["ai_query_input"] = q

    st.markdown("")

    # Поле ввода запроса.
    query = st.text_area(
        "Ваш запрос",
        value=st.session_state.get("ai_query_input", ""),
        height=90,
        placeholder="Например: романтический ужин, итальянская кухня, премиум, с террасой...",
        label_visibility="collapsed",
    )

    col_btn, col_n, col_info = st.columns([1, 1, 2])
    with col_btn:
        run = st.button("🚀 Подобрать заведения", type="primary", use_container_width=True)
    with col_n:
        top_n = st.selectbox("Сколько вариантов", [3, 5, 7, 10], index=1)
    with col_info:
        if query:
            parsed = parse_query(query)
            chips = []
            for s in parsed["scenarios"]:
                chips.append(SCENARIO_LABELS.get(s, s))
            chips += parsed["cuisines"] + parsed["atmosphere"]
            if parsed["price"]:
                chips.append(price_segment_label(parsed["price"]))
            if parsed["amenities"]:
                chips += parsed["amenities"]
            if chips:
                st.caption("Распознанные параметры: " + " · ".join(chips))

    if run and query.strip():
        with st.spinner("AI подбирает заведения..."):
            venues = get_all_venues(st.session_state.data_mode)
            results = match_venues(query, venues=venues, top_n=top_n)
            st.session_state.last_results = results
            st.session_state.chat_history.append({"role": "user", "text": query})
            st.session_state.chat_history.append(
                {"role": "ai", "text": f"Нашёл {len(results)} подходящих заведения."}
            )

    # Результаты подбора.
    results = st.session_state.get("last_results", [])
    if results:
        st.markdown(f"### 🎯 Топ-{len(results)} подходящих заведений")
        st.caption("Оценка match_score — совпадение запроса по сценарию, кухне, цене и AI score.")
        for r in results:
            render_match_card(r)
    elif not query.strip():
        st.info("👆 Введите запрос или выберите пример выше, чтобы начать подбор.")


def render_match_card(result: dict) -> None:
    """Карточка результата AI-подбора."""
    venue = result["venue"]
    score = result["match_score"]
    reasons = result.get("reasons", [])
    reasons_html = "".join(f'<div class="mf-reason">{x}</div>' for x in reasons)

    st.markdown(
        f"""
        <div class="mf-venue-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div class="mf-venue-name">{venue['name']}</div>
                    <div class="mf-venue-meta">
                        {venue.get('category', '')} · {venue.get('district', '—')} ·
                        {price_segment_label(venue.get('price_segment', ''))} ·
                        чек {format_check(venue.get('average_check'))}
                    </div>
                </div>
                <span class="mf-score-badge">{score}</span>
            </div>
            <div style="margin: 8px 0;">{tags_html(venue)}</div>
            {reasons_html}
        </div>
        """,
        unsafe_allow_html=True,
    )
    with st.expander(f"Подробнее о «{venue['name']}»"):
        render_venue_detail(venue, compact=True)


# --------------------------------------------------------------------------- #
# Страница: Каталог.
# --------------------------------------------------------------------------- #


def render_catalog_page() -> None:
    st.markdown("## 🍽️ Каталог заведений Алматы")
    st.caption(f"50 объектов · данные на {LAST_VERIFIED_AT}")

    venues = get_all_venues(st.session_state.data_mode)

    # --- Боковая панель фильтров ---
    with st.container():
        col_f1, col_f2, col_f3, col_f4 = st.columns(4)

        with col_f1:
            sel_category = st.multiselect("Категория", ALL_CATEGORIES)
            sel_district = st.multiselect("Район", ALL_DISTRICTS)

        with col_f2:
            sel_cuisines = st.multiselect("Кухня", ALL_CUISINES)
            scenario_options = list(SCENARIO_LABELS.keys())
            sel_scenario = st.selectbox(
                "Сценарий (мин. оценка 3/5)",
                [""] + scenario_options,
                format_func=lambda s: SCENARIO_LABELS.get(s, "— Любой —") if s else "— Любой —",
            )

        with col_f3:
            sel_prices = st.multiselect(
                "Ценовой сегмент",
                PRICE_SEGMENTS,
                format_func=price_segment_label,
            )
            min_ai = st.slider("Минимальный AI score", 0, 100, 0, step=5)

        with col_f4:
            st.markdown("**Инфраструктура**")
            am_cols = st.columns(2)
            am_checks = {}
            amenities_list = [
                ("terrace", "Терраса"), ("parking", "Парковка"),
                ("wifi", "Wi-Fi"), ("vip_room", "VIP-зал"),
                ("kids_room", "Детская комната"), ("live_music", "Живая музыка"),
                ("breakfast", "Завтраки"), ("delivery", "Доставка"),
            ]
            for i, (key, label) in enumerate(amenities_list):
                with am_cols[i % 2]:
                    am_checks[key] = st.checkbox(label, key=f"am_{key}")
            booking_only = st.checkbox("🎓 Только с бронированием")

        # --- Поиск по названию ---
        search = st.text_input("🔎 Поиск по названию", "")

    # --- Применение фильтров ---
    amenities_filter = {k: v for k, v in am_checks.items() if v}
    filtered = filter_venues(
        venues,
        category=sel_category[0] if sel_category else None,
        price_segments=sel_prices or None,
        cuisines=sel_cuisines or None,
        district=sel_district[0] if sel_district else None,
        min_ai_score=min_ai if min_ai > 0 else None,
        amenities=amenities_filter or None,
        scenario=sel_scenario or None,
        booking_only=booking_only,
    )

    if search:
        s = search.lower()
        filtered = [v for v in filtered if s in v.get("name", "").lower()]

    st.markdown(f"**Найдено: {len(filtered)} из {len(venues)}**")

    # --- Сортировка ---
    sort_by = st.selectbox(
        "Сортировать по",
        ["ai_score", "average_check_asc", "average_check_desc", "name"],
        format_func=lambda s: {
            "ai_score": "AI score (убыв.)",
            "average_check_asc": "Средний чек (возр.)",
            "average_check_desc": "Средний чек (убыв.)",
            "name": "Название (А-Я)",
        }[s],
    )
    if sort_by == "ai_score":
        filtered.sort(key=lambda v: v.get("ai_score", 0), reverse=True)
    elif sort_by == "name":
        filtered.sort(key=lambda v: v.get("name", ""))
    elif sort_by == "average_check_asc":
        filtered.sort(key=lambda v: v.get("average_check") or 999999)
    elif sort_by == "average_check_desc":
        filtered.sort(key=lambda v: v.get("average_check") or 0, reverse=True)

    # --- Сетка карточек ---
    if not filtered:
        st.warning("Ничего не найдено. Ослабьте фильтры.")
    else:
        for venue in filtered:
            render_catalog_card(venue)


def render_catalog_card(venue: dict) -> None:
    """Карточка заведения в каталоге."""
    seg = venue.get("price_segment", "")
    seg_label = price_segment_label(seg)
    seg_color = price_segment_color(seg)

    rating_html = ""
    if venue.get("rating_2gis"):
        rating_html = f'<span class="mf-tag" style="background:#dcfce7; color:#15803d;">⭐ {venue["rating_2gis"]} 2ГИС</span>'

    st.markdown(
        f"""
        <div class="mf-venue-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1;">
                    <div class="mf-venue-name">{venue['name']}</div>
                    <div class="mf-venue-meta">
                        {venue.get('category', '')} · {venue.get('subcategory', '')} ·
                        {venue.get('district', '—')}
                    </div>
                    <div style="margin:6px 0;">{tags_html(venue)} {rating_html}</div>
                    <div class="mf-venue-meta">
                        📍 {venue.get('address', '—')} · 💰 <b style="color:{seg_color};">{seg_label}</b> ·
                        чек {format_check(venue.get('average_check'))}
                    </div>
                </div>
                <span class="mf-score-badge" title="AI score">AI {venue.get('ai_score', '—')}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    with st.expander(f"Карточка «{venue['name']}»"):
        render_venue_detail(venue, compact=False)


# --------------------------------------------------------------------------- #
# Детальная карточка заведения.
# --------------------------------------------------------------------------- #


def render_venue_detail(venue: dict, compact: bool = False) -> None:
    """Полная карточка с меню, сценариями, инфраструктурой."""
    col_a, col_b = st.columns([2, 1])

    with col_a:
        st.markdown(f"**{venue['name']}** · `{venue.get('venue_id', '')}`")
        st.caption(f"{venue.get('category', '')} / {venue.get('subcategory', '')}")

        info_rows = [
            ("📍 Адрес", venue.get("address", "—")),
            ("🏙️ Район", venue.get("district", "—")),
            ("🍽️ Кухня", ", ".join(venue.get("cuisines") or []) or "—"),
            ("💰 Ценовой сегмент", price_segment_label(venue.get("price_segment", ""))),
            ("💵 Средний чек", format_check(venue.get("average_check"))),
            ("⭐ Рейтинг 2ГИС", venue.get("rating_2gis", "—")),
            ("🕒 График", venue.get("working_hours", "—")),
            ("📞 Телефон", venue.get("phone", "—")),
            ("🌐 Сайт", venue.get("website", "—")),
            ("📸 Instagram", venue.get("instagram", "—")),
            ("🗺️ 2ГИС", venue.get("two_gis_url", "—")),
        ]
        for label, val in info_rows:
            if val and val != "—":
                st.markdown(f"**{label}:** {val}")

    with col_b:
        seg = venue.get("price_segment", "")
        st.markdown(f"### 🏆 AI score")
        st.markdown(f"# :violet[{venue.get('ai_score', '—')}/100]")
        st.caption(f"Уверенность: {venue.get('confidence', '—')}")
        st.markdown(f"**Цена:** :{price_segment_color(seg)}[{price_segment_label(seg)}]")
        st.caption(f"Статус: {venue.get('verification_status', '—')}")

    # Сценарии.
    st.markdown("#### 🎯 Подходит для сценариев (0–5)")
    sc = venue.get("scenarios") or {}
    sc_cols = st.columns(5)
    for i, (key, label) in enumerate(SCENARIO_LABELS.items()):
        with sc_cols[i % 5]:
            score = sc.get(key, 0)
            emoji = "🟢" if score >= 4 else ("🟡" if score >= 3 else ("🔴" if score <= 1 else "⚪"))
            st.metric(label, f"{emoji} {score}")

    # Инфраструктура.
    st.markdown("#### 🛎️ Инфраструктура")
    infra_keys = [
        ("booking_available", "Бронирование"), ("wifi", "Wi-Fi"), ("parking", "Парковка"),
        ("terrace", "Терраса"), ("vip_room", "VIP-зал"), ("kids_room", "Детская комната"),
        ("live_music", "Живая музыка"), ("breakfast", "Завтраки"), ("brunch", "Brunch"),
        ("business_lunch", "Бизнес-ланч"), ("delivery", "Доставка"), ("takeaway", "Takeaway"),
        ("wine_card", "Винная карта"), ("kids_menu", "Детское меню"),
        ("vegetarian", "Вегетарианское"), ("vegan", "Vegan"), ("halal", "Halal"),
        ("banquet_available", "Банкет"),
    ]
    infra_cols = st.columns(6)
    for i, (key, label) in enumerate(infra_keys):
        val = venue.get(key)
        if val is None:
            continue
        with infra_cols[i % 6]:
            icon = "✅" if val else "❌"
            st.caption(f"{icon} {label}")

    # Плюсы / минусы.
    pros = venue.get("pros") or []
    cons = venue.get("cons") or []
    if pros or cons:
        pc1, pc2 = st.columns(2)
        with pc1:
            st.markdown("#### ✅ Плюсы")
            for p in pros:
                st.markdown(f"- {p}")
        with pc2:
            st.markdown("#### ⚠️ Ограничения")
            for c in cons:
                st.markdown(f"- {c}")

    if venue.get("best_for"):
        st.markdown(f"**🏆 Лучший сценарий:** {', '.join(venue['best_for'])}")

    st.caption(f"Проверено: {venue.get('last_verified_at', LAST_VERIFIED_AT)}")


# --------------------------------------------------------------------------- #
# Страница: Аналитика рынка.
# --------------------------------------------------------------------------- #


def render_analytics_page() -> None:
    import pandas as pd

    st.markdown("## 📊 Аналитика рынка заведений Алматы")
    st.caption(f"На основе каталога из 50 объектов · {LAST_VERIFIED_AT}")

    venues = get_all_venues(st.session_state.data_mode)
    df = pd.DataFrame(venues)

    # Обзорные метрики.
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Всего заведений", len(venues))
    with m2:
        booking = sum(1 for v in venues if v.get("booking_available"))
        st.metric("С бронированием", booking)
    with m3:
        avg_ai = sum(v.get("ai_score", 0) for v in venues) / max(len(venues), 1)
        st.metric("Средний AI score", f"{avg_ai:.0f}")
    with m4:
        checks = [v.get("average_check") for v in venues if v.get("average_check")]
        avg_check = sum(checks) / len(checks) if checks else 0
        st.metric("Средний чек", format_check(int(avg_check)))

    st.markdown("---")

    # Распределение по категориям.
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### По категориям")
        cat_counts = df["category"].value_counts()
        st.bar_chart(cat_counts)

    with col2:
        st.markdown("### По ценовым сегментам")
        df["price_label"] = df["price_segment"].map(price_segment_label)
        price_counts = df["price_label"].value_counts()
        st.bar_chart(price_counts)

    # Кухни.
    st.markdown("### Топ кухонь")
    all_cuisines_list = []
    for v in venues:
        all_cuisines_list.extend(v.get("cuisines") or [])
    if all_cuisines_list:
        cu_df = pd.Series(all_cuisines_list).value_counts().head(12)
        st.bar_chart(cu_df)

    # Районы.
    st.markdown("### По районам")
    districts = [v.get("district") for v in venues if v.get("district") and v["district"] != "Не найдено"]
    if districts:
        d_df = pd.Series(districts).value_counts()
        st.bar_chart(d_df)

    # AI score топ-15.
    st.markdown("### Топ-15 по AI score")
    top_df = df.sort_values("ai_score", ascending=False).head(15)
    st.dataframe(
        top_df[["name", "category", "price_segment", "district", "ai_score", "confidence"]],
        column_config={
            "name": st.column_config.TextColumn("Заведение"),
            "category": st.column_config.TextColumn("Категория"),
            "price_segment": st.column_config.TextColumn("Цена"),
            "district": st.column_config.TextColumn("Район"),
            "ai_score": st.column_config.ProgressColumn("AI score", min_value=0, max_value=100),
            "confidence": st.column_config.TextColumn("Уверенность"),
        },
        use_container_width=True,
        hide_index=True,
    )

    # Покрытие сценариев.
    st.markdown("### Покрытие сценариев (средняя оценка)")
    sc_data = {}
    for key, label in SCENARIO_LABELS.items():
        vals = [(v.get("scenarios") or {}).get(key, 0) for v in venues]
        sc_data[label] = sum(vals) / len(vals) if vals else 0
    sc_df = pd.Series(sc_data)
    st.bar_chart(sc_df)

    with st.expander("📝 Формула AI score"):
        st.markdown(
            """
            **Score = 0.20·P + 0.15·R + 0.10·D + 0.15·B + 0.10·U + 0.15·S + 0.15·M**

            - **P** — Popularity (популярность, узнаваемость)
            - **R** — Rating/reviews (рейтинг с поправкой на объём отзывов)
            - **D** — Data completeness (полнота данных)
            - **B** — Booking potential (потенциал бронирования)
            - **U** — Variety/uniqueness (уникальность)
            - **S** — User scenario coverage (покрытие сценариев)
            - **M** — Marketplace potential (ценность для AI Marketplace)
            """
        )


# --------------------------------------------------------------------------- #
# Точка входа.
# --------------------------------------------------------------------------- #


def main() -> None:
    init_state()
    page = render_sidebar()

    st.markdown(
        f'<div class="mf-brand-title" style="font-size:1.6rem; margin-bottom:4px;">{BRAND}</div>',
        unsafe_allow_html=True,
    )
    st.caption(TAGLINE)

    if page == "ai":
        render_ai_page()
    elif page == "catalog":
        render_catalog_page()
    elif page == "analytics":
        render_analytics_page()

    # Подвал.
    st.markdown("---")
    st.caption(
        f"**{BRAND}** · {TAGLINE} · Данные на {LAST_VERIFIED_AT} · "
        "Источники: 2ГИС, Tripadvisor, Restolife, Restoran.kz, The World's 50 Best Discovery"
    )


if __name__ == "__main__":
    main()
