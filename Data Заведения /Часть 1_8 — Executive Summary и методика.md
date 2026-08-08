<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Часть 1/8 — Executive Summary и методика

## 1. Статус исследования

Начал исследование базы из 50 заведений Алматы по состоянию на **8 августа 2026 года**.

Важно: на этом этапе подготовлен **первичный shortlist из 50 заведений и методика отбора**. Это ещё не финальная карточная база: точные адреса, филиалы, телефоны, меню, цены, часы работы, парковка и бронирование будут проверяться по каждому заведению отдельно. Поэтому ниже намеренно не проставляю неподтверждённые значения.

Исследование будет разделено на несколько частей:

1. Executive Summary и методика.
2. Top 50 и рейтинг кандидатов.
3. Расширенные карточки 1–17.
4. Расширенные карточки 18–34.
5. Расширенные карточки 35–50 и меню.
6. AI Matching Matrix.
7. Market Analysis и Data Quality Report.
8. Database Schema, CSV-ready структура и MVP Data Strategy.

## 2. Источники и ограничения

Для формирования первоначального списка использованы:

- Tripadvisor — рейтинг, количество отзывов, категории кухни, ценовые диапазоны, признаки бронирования и сценарии использования.
- Restolife — локальный рейтинг заведений Алматы, основанный на данных 2GIS, Яндекс Карт, Google Maps и собственных показателях.
- Restoran.kz — локальные подборки, учитывающие отзывы, рейтинги и бронирования.
- Yandex Ultima Guide — анализ более 3 900 заведений по более чем 100 критериям.
- The World’s 50 Best Discovery через Kursiv — международное признание отдельных заведений Алматы.

Tripadvisor показывает более 1 267 ресторанных объектов Алматы и ранжирует их с учётом просмотров страниц, отзывов, цены, кухни, расположения и пользовательского взаимодействия. В числе заметных объектов на странице находятся Nuala, Beefeater Dostyk, Chechil Rozybakiyeva, Manga Sushi, Tyubeteika, Ocean Basket и другие. cite[^1]

Yandex Ultima Guide использует отдельную модель, анализирующую популярность, оценки, отзывы, комфорт, шум, сервис, интерьер и барную карту; кофейни, фуд-моллы и сетевые рестораны в основной ресторанный список не включаются, поскольку для них требуется другая методика. cite[^2]

В The World’s 50 Best Discovery в 2026 году вошли алматинские проекты **Сё-Сё, Домашний, Yellow Door и French 42**. Ранее в этот гид также попадали Auyl и другие казахстанские проекты. cite[^3]

## 3. Методика отбора

Для MVP предлагаю не использовать простой рейтинг по количеству отзывов. Итоговый балл должен учитывать семь факторов:

$$
Score =
0.20P +
0.15R +
0.10D +
0.15B +
0.10U +
0.15S +
0.15M
$$

где:

- $P$ — Popularity, популярность и узнаваемость;
- $R$ — Rating/reviews, рейтинг с поправкой на объём отзывов;
- $D$ — Data completeness, полнота доступных данных;
- $B$ — Booking potential, потенциал бронирования;
- $U$ — Variety/uniqueness, уникальность и разнообразие;
- $S$ — User scenario coverage, покрытие пользовательских сценариев;
- $M$ — Marketplace potential, ценность для AI Marketplace.

Для рейтинга отзывов предлагаю использовать сглаженную оценку, чтобы заведение с рейтингом 5.0 и 4 отзывами автоматически не обгоняло место с рейтингом 4.7 и 800 отзывами:

$$
AdjustedRating =
\frac{v}{v+m}R +
\frac{m}{v+m}C
$$

где:

- $R$ — рейтинг заведения;
- $v$ — число отзывов;
- $C$ — средний рейтинг по исследуемой выборке;
- $m$ — минимальный порог отзывов.

Финальный балл должен хранить не только числовое значение, но и уровень уверенности:

- `high_confidence`;
- `medium_confidence`;
- `low_confidence`;
- `not_enough_data`.


## 4. Предварительный Top 50

Ниже приведён **первичный состав базы**, а не окончательный рейтинг. Позиции 1–50 будут пересчитаны после проверки 2GIS, официальных источников, актуальных меню и возможностей бронирования.


| ID | Заведение | Основная роль в MVP | Предварительная причина включения | Текущий статус |
| --: | :-- | :-- | :-- | :-- |
| ALM-001 | Nuala | Premium / fine dining | Высокий Tripadvisor-рейтинг, туристическая привлекательность, премиальный сценарий | Partially verified |
| ALM-002 | Beefeater Dostyk | Steakhouse / bar | Высокий рейтинг и большой объём отзывов | Partially verified |
| ALM-003 | Chechil Rozybakiyeva | Pub / casual dining | Высокая узнаваемость, большой объём отзывов, демократичный сегмент | Partially verified |
| ALM-004 | Daredzhani Kunayeva | Georgian restaurant | Высокий рейтинг, семейные и групповые сценарии | Partially verified |
| ALM-005 | Manga Sushi | Japanese / sushi | Высокий рейтинг, доставка, takeaway и семейный спрос | Partially verified |
| ALM-006 | Tyubeteika | Central Asian / Uzbek | Большой объём отзывов, туристический сценарий | Partially verified |
| ALM-007 | Ocean Basket Panfilova | Seafood | Высокий рейтинг, понятная специализация, туристический потенциал | Partially verified |
| ALM-008 | Sandyq | Kazakh cuisine | Национальная кухня, премиальный туристический сценарий | Partially verified |
| ALM-009 | Navat | Central Asian / casual | Узнаваемый бренд, национальная кухня, доступный сегмент | Partially verified |
| ALM-010 | Vista | Italian / hotel dining | Премиальный ресторанный и гостиничный сценарий | Partially verified |
| ALM-011 | Seven Bar and Restaurant | French / steakhouse / bar | Премиальный ужин, романтический и деловой сценарии | Partially verified |
| ALM-012 | La Barca Fish \& Wine | Seafood / wine | Уникальная специализация, premium dining | Partially verified |
| ALM-013 | INZHU | Mediterranean / European | Премиальный интерьер и гастрономический сценарий | Partially verified |
| ALM-014 | Bosphorus Restaurant | Turkish | Туристическая и семейная кухня, premium-сегмент | Partially verified |
| ALM-015 | Kazakh Restaurant Abay | Kazakh / barbecue | Национальная кухня и группы | Partially verified |
| ALM-016 | KetchUp | Burgers / fast casual | Высокий рейтинг и массовый casual-сценарий | Partially verified |
| ALM-017 | Mapache Bar — Steak \& Burger | American / steakhouse | Высокий рейтинг, вечерний и групповой сценарии | Partially verified |
| ALM-018 | Tang Ramen Bar | Japanese / ramen | Уникальный формат, молодёжная аудитория | Partially verified |
| ALM-019 | Line Brew | Steakhouse / beer bar | Узнаваемый формат, компании и вечерний спрос | Partially verified |
| ALM-020 | Alasha | Uzbek / show restaurant | Традиционная кухня, шоу-программа, большие компании | Partially verified |
| ALM-021 | Tandoor | Indian | Недостаточно представленный сегмент индийской кухни | Partially verified |
| ALM-022 | Beefeater Samal | European / wine bar | Премиальный casual, вечерний сценарий | Partially verified |
| ALM-023 | The Pakwaan | Indian / vegetarian | Вегетарианская и vegan-репрезентация | Partially verified |
| ALM-024 | Aroma | Cafe / European | Завтраки, brunch, business meeting | Partially verified |
| ALM-025 | Breakfast Martini | Cafe / brunch | Завтраки, brunch, pet-friendly-сценарий требует проверки | Partially verified |
| ALM-026 | Auyl Cafe | Kazakh / Central Asian | Культурный бренд, национальная кухня, туристическая ценность | Partially verified |
| ALM-027 | Сё-Сё | Contemporary / gastronomic | Международное признание и высокая уникальность | Partially verified |
| ALM-028 | Домашний | Bar / local concept | Международное признание, барная категория | Partially verified |
| ALM-029 | Yellow Door | Cocktail bar | Международное признание, nightlife и cocktail-сценарий | Partially verified |
| ALM-030 | French 42 | Cocktail bar | Международное признание, вечерний формат | Partially verified |
| ALM-031 | Sumo-San | Japanese / sushi | Доступный японский формат, заметный объём отзывов | Partially verified |
| ALM-032 | Villa Dei Fiori | Italian | Премиальная итальянская кухня | Partially verified |
| ALM-033 | Parmigiano Ristorante Syrovarnya | Italian / cheese-focused | Уникальная специализация и premium-casual | Partially verified |
| ALM-034 | Bellagio Restaurant \& Club | Italian / club | Ужин, nightlife и мероприятия | Partially verified |
| ALM-035 | Daredzhani Kurmangazy | Georgian | Отдельный филиал, нельзя смешивать с Kunayeva | Partially verified |
| ALM-036 | Chechil Forum | Pub / live music | Большие компании, музыка, вечерние мероприятия | Partially verified |
| ALM-037 | Chechil 4mkrn | Pub / casual | Отдельный филиал сети, локальный спрос | Partially verified |
| ALM-038 | U Afanasicha | Russian / European | Завтраки, бизнес-ланч и демократичный ресторанный формат | Partially verified |
| ALM-039 | Chalet | European / scenic dining | Сценарий отдыха, видовая или загородная составляющая требует проверки | Partially verified |
| ALM-040 | Nice Restaurant | Cafe / restaurant | Завтраки, бизнес-ланч, средний сегмент | Partially verified |
| ALM-041 | Саксаул | Central Asian | Известное заведение национальной кухни | Partially verified |
| ALM-042 | Turandot на Достык | Asian / restaurant | Завтраки, бизнес-ланч, центральная локация | Partially verified |
| ALM-043 | MORE \& MORE | Restaurant / premium | Высокий средний чек и вечерний сценарий | Partially verified |
| ALM-044 | Erbil | Restaurant | Демократичный формат и отдельная кухня требуют уточнения | Partially verified |
| ALM-045 | Белый Слон | Bar / restaurant | Ночная жизнь, коктейли, вечерний сценарий | Partially verified |
| ALM-046 | Harat’s Republic | Irish pub | Бар, группы, поздний график, мероприятия | Partially verified |
| ALM-047 | Avenue Lounge \& Karaoke | Karaoke / lounge | Большие компании, private events и ночной формат | Partially verified |
| ALM-048 | Hopersbar | Bar | Ночной формат и бронирование групп | Partially verified |
| ALM-049 | Friends Bar \& Terrace | Bar / terrace | Терраса, компании и вечерние встречи | Partially verified |
| ALM-050 | Dragonfly Izakaya | Japanese / izakaya | Положительные локальные отзывы, день рождения и вечерние встречи | Partially verified |

### Почему в список включены филиалы

Для marketplace филиал должен быть отдельной сущностью. Например:

- `Chechil Rozybakiyeva`;
- `Chechil Forum`;
- `Chechil 4mkrn`;

нельзя объединять в одну строку, поскольку у них могут отличаться адрес, часы работы, парковка, вместимость, меню, доступность бронирования и рейтинг.

То же относится к:

- Daredzhani Kunayeva и Daredzhani Kurmangazy;
- Beefeater Dostyk и Beefeater Samal;
- отдельным филиалам других сетей.

Tripadvisor отдельно показывает различия между филиалами Chechil и Daredzhani, включая разные оценки и количество отзывов. Например, для Daredzhani Kunayeva указано 4.6/5 и 586 отзывов, для Chechil Rozybakiyeva — 4.9/5 и 444 отзыва, а для Chechil Forum — 4.9/5 и 245 отзывов. cite[^1]

## 5. Первичная проверка популярности

На текущем этапе уже видны несколько групп:

### Международно заметные

- Сё-Сё.
- Домашний.
- Yellow Door.
- French 42.
- Auyl.
- Nuala.
- Sandyq.

Четыре первых проекта получили признание The World’s 50 Best Discovery, что повышает их туристическую и маркетплейсную ценность, но само по себе не доказывает высокий объём локальных бронирований. cite[^3]

### Сильные по объёму отзывов

- Beefeater Dostyk.
- Daredzhani Kunayeva.
- Chechil Rozybakiyeva.
- Tyubeteika.
- Alasha.
- Navat.
- Manga Sushi.
- Line Brew.

Эти заведения полезны для MVP, потому что позволяют покрыть массовые сценарии и получить больше пользовательских сигналов. При этом объём отзывов не следует трактовать как прямой показатель качества.

### Сильные по уникальности

- Nuala.
- Sandyq.
- Auyl Cafe.
- Сё-Сё.
- Yellow Door.
- French 42.
- The Pakwaan.
- Tang Ramen Bar.
- La Barca Fish \& Wine.

Их важно включить в демонстрацию AI-подбора, поскольку они лучше показывают различия между запросами «национальная кухня», «веганское», «коктейльный бар», «романтический ужин» и «необычный гастрономический опыт».

## 6. Основные ограничения

Наиболее важные ограничения текущей версии:

- Полноценные данные 2GIS по каждому заведению нельзя надёжно заменить сниппетом поисковой выдачи.
- Рейтинги и число отзывов на картах динамические и могут различаться по филиалам.
- Меню часто публикуется в Instagram, PDF, Stories или закрытых сервисах бронирования.
- Средний чек у части заведений доступен только в агрегаторах и может быть устаревшим.
- Наличие Wi‑Fi, парковки, розеток, детских стульчиков и pet-friendly-условий редко подтверждается формально.
- Режим кухни может отличаться от режима работы ресторана.
- Для части заведений нужно вручную проверять, продолжают ли они работать именно по указанному адресу.
- Наличие онлайн-бронирования не всегда означает наличие API или автоматического подтверждения.

Поэтому в итоговой базе каждое поле должно иметь не только значение, но и:

```text
value
source_url
source_type
checked_at
verification_status
confidence
```


## 7. Предлагаемая модель статусов

Для каждой записи буду использовать следующие статусы:


| Статус | Значение |
| :-- | :-- |
| Verified | Подтверждено актуальным первичным или официальным источником |
| Partially verified | Подтверждена только часть полей |
| Outdated risk | Источник существует, но есть риск устаревания |
| Conflicting sources | Источники показывают разные значения |
| Not found | Надёжное значение не найдено |

## 8. Предварительные продуктовые выводы

Уже на этапе shortlist видно, что каталог только ресторанов будет недостаточен. Для AI Marketplace Алматы нужно одновременно покрывать:

- повседневные демократичные рестораны;
- места для свиданий;
- бары и cocktail bars;
- национальную кухню;
- завтраки и brunch;
- семейные места;
- заведения для больших компаний;
- караоке и lounge;
- площадки для мероприятий;
- рестораны с туристической ценностью.

Yandex Ultima Guide также разделяет рестораны и бары как разные исследовательские категории: в алматинском лонг-листе были выделены 396 ресторанов и 57 баров. Это подтверждает, что ресторанный и nightlife-сегменты лучше моделировать раздельно, даже если они находятся в одном marketplace. cite[^2]

Следующая часть должна содержать **Top 50 с расширенными колонками, предварительным 100-балльным рейтингом и отдельным источником по каждой строке**.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.tripadvisor.com/Restaurants-g298251-Almaty.html

[^2]: https://openkitchen.eda.yandex/article/places/guides/ultima-guide-2026-luchshie-restorany-i-bary-astany-i-almaty

[^3]: https://kz.kursiv.media/2026-07-16/assm-kazakhstan-voshel-v-prestizhniy-gastronomicheskiy-gid-the-world-s-50-best-discovery/

[^4]: https://restolife.kz/rating/

[^5]: https://ru.restaurantguru.com/Almaty

[^6]: https://restoran.kz/selections/top-20-luchshih-pabov-barov

[^7]: https://tur-ray.ru/almaty-attractions.html

[^8]: https://www.tripadvisor.ru/Restaurants-g298251-Almaty.html

[^9]: https://www.tripadvisor.ru/Restaurants-g298251-zfp10954-Almaty.html

[^10]: https://restolife.kz/cafe/

[^11]: https://www.afisha.ru/restaurant-news/wheretoeat-nazval-50-luchshih-restoranov-kazahstana/

[^12]: https://restoran.kz/selections/top-10-luchshih-restoranov

[^13]: https://restoran.kz/cafe

[^14]: https://top20.best/ru/almaty/restoranyi-kafe-baryi/kafe-baryi/

[^15]: https://almaty.ppz.kz/ru/places/

