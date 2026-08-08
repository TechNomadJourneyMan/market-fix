import type { Menu, MenuItem, MenuSection, Venue } from '@/types';
import { createRandom, hashString, pickMany } from '@/lib/utils';

const NOW = '2026-01-10T09:00:00.000Z';

interface DishTemplate {
  name: string;
  description: string;
  /** Доля от среднего чека. */
  factor: number;
  weight?: string;
  vegetarian?: boolean;
  spicy?: boolean;
  allergens?: string[];
}

type SectionKey = 'starters' | 'mains' | 'desserts' | 'drinks' | 'bar' | 'baking';

const SECTION_TITLES: Record<SectionKey, string> = {
  starters: 'Закуски и салаты',
  mains: 'Основные блюда',
  desserts: 'Десерты',
  drinks: 'Напитки',
  bar: 'Бар',
  baking: 'Выпечка',
};

/** Блюда по кухням — набор подбирается под cuisineIds заведения. */
const DISHES_BY_CUISINE: Record<string, Partial<Record<SectionKey, DishTemplate[]>>> = {
  'cui-italian': {
    starters: [
      { name: 'Брускетта с томатами', description: 'Хрустящий хлеб, черри, базилик и оливковое масло', factor: 0.16, weight: '180 г', vegetarian: true, allergens: ['глютен'] },
      { name: 'Карпаччо из говядины', description: 'Тонкие слайсы, руккола, пармезан, каперсы', factor: 0.32, weight: '150 г', allergens: ['молоко'] },
      { name: 'Салат «Капрезе»', description: 'Моцарелла ди буфала, томаты, песто', factor: 0.24, weight: '220 г', vegetarian: true, allergens: ['молоко'] },
    ],
    mains: [
      { name: 'Тальятелле с рагу болоньезе', description: 'Паста ручной работы, томлёная говядина 6 часов', factor: 0.44, weight: '320 г', allergens: ['глютен', 'яйцо'] },
      { name: 'Ризотто с белыми грибами', description: 'Карнароли, пармезан, трюфельное масло', factor: 0.48, weight: '280 г', vegetarian: true, allergens: ['молоко'] },
      { name: 'Пицца «Маргарита»', description: 'Тесто 48 часов ферментации, печь на дровах', factor: 0.36, weight: '450 г', vegetarian: true, allergens: ['глютен', 'молоко'] },
      { name: 'Лазанья по-домашнему', description: 'Слоями с бешамелем и пармезаном', factor: 0.42, weight: '350 г', allergens: ['глютен', 'молоко'] },
    ],
    desserts: [
      { name: 'Тирамису', description: 'Маскарпоне, савоярди, эспрессо', factor: 0.2, weight: '160 г', vegetarian: true, allergens: ['молоко', 'яйцо', 'глютен'] },
      { name: 'Панна котта', description: 'Сливочный десерт с ягодным кули', factor: 0.18, weight: '150 г', vegetarian: true, allergens: ['молоко'] },
    ],
  },
  'cui-japanese': {
    starters: [
      { name: 'Эдамаме с морской солью', description: 'Молодые соевые бобы на пару', factor: 0.14, weight: '150 г', vegetarian: true, allergens: ['соя'] },
      { name: 'Гёдза с креветкой', description: 'Обжаренные пельмени, соус понзу', factor: 0.28, weight: '180 г', allergens: ['глютен', 'морепродукты'] },
      { name: 'Салат чука', description: 'Водоросли, ореховый соус', factor: 0.2, weight: '140 г', vegetarian: true, allergens: ['орехи', 'кунжут'] },
    ],
    mains: [
      { name: 'Сет «Филадельфия»', description: 'Лосось, сливочный сыр, 16 кусочков', factor: 0.66, weight: '480 г', allergens: ['рыба', 'молоко'] },
      { name: 'Рамен тонкоцу', description: 'Бульон 12 часов, чашу, темаго', factor: 0.4, weight: '520 г', allergens: ['глютен', 'яйцо', 'соя'] },
      { name: 'Нигири с тунцом', description: 'Свежий тунец прямого привоза, 2 шт.', factor: 0.3, weight: '90 г', allergens: ['рыба'] },
      { name: 'Терияки с курицей', description: 'Соус терияки, рис, кунжут', factor: 0.38, weight: '340 г', allergens: ['соя', 'кунжут'] },
    ],
    desserts: [
      { name: 'Моти ассорти', description: 'Рисовые пирожные, 3 вкуса', factor: 0.18, weight: '120 г', vegetarian: true },
    ],
  },
  'cui-georgian': {
    starters: [
      { name: 'Пхали ассорти', description: 'Три вида: шпинат, свёкла, баклажан', factor: 0.22, weight: '240 г', vegetarian: true, allergens: ['орехи'] },
      { name: 'Бадриджани', description: 'Баклажаны с ореховой пастой и гранатом', factor: 0.24, weight: '200 г', vegetarian: true, allergens: ['орехи'] },
    ],
    mains: [
      { name: 'Хинкали с мясом', description: 'Ручная лепка, 5 штук', factor: 0.34, weight: '450 г', allergens: ['глютен'] },
      { name: 'Хачапури по-аджарски', description: 'Лодочка с сулугуни и яйцом', factor: 0.32, weight: '380 г', vegetarian: true, allergens: ['глютен', 'молоко', 'яйцо'] },
      { name: 'Чашушули', description: 'Телятина в томатах с зеленью', factor: 0.46, weight: '320 г', spicy: true },
      { name: 'Шашлык из свиной шеи', description: 'На углях, с луком и ткемали', factor: 0.5, weight: '300 г' },
    ],
    desserts: [
      { name: 'Чурчхела', description: 'Виноградный сок и грецкий орех', factor: 0.12, weight: '100 г', vegetarian: true, allergens: ['орехи'] },
    ],
  },
  'cui-kazakh': {
    starters: [
      { name: 'Казы домашняя', description: 'Конская колбаса тонкой нарезки', factor: 0.34, weight: '150 г' },
      { name: 'Салат «Ащы-Шучук»', description: 'Свежие овощи, зелень, кисло-острая заправка', factor: 0.18, weight: '200 г', vegetarian: true, spicy: true },
    ],
    mains: [
      { name: 'Бешбармак с кониной', description: 'Домашняя сочная лапша, казы, шужык', factor: 0.62, weight: '600 г', allergens: ['глютен'] },
      { name: 'Куырдак в казане', description: 'Баранина, картофель, лук', factor: 0.44, weight: '350 г' },
      { name: 'Манты с тыквой', description: 'На пару, 5 штук', factor: 0.3, weight: '400 г', vegetarian: true, allergens: ['глютен'] },
      { name: 'Плов по-казахски', description: 'Рис девзира, баранина, нут', factor: 0.36, weight: '380 г' },
    ],
    desserts: [
      { name: 'Баурсаки с мёдом', description: 'Жарятся при вас, подаются горячими', factor: 0.14, weight: '200 г', vegetarian: true, allergens: ['глютен'] },
    ],
  },
  'cui-asian': {
    starters: [
      { name: 'Димсамы с креветкой', description: 'На пару, 4 штуки', factor: 0.28, weight: '160 г', allergens: ['морепродукты', 'глютен'] },
      { name: 'Спринг-роллы', description: 'Овощи, рисовая бумага, соус чили', factor: 0.22, weight: '180 г', vegetarian: true, spicy: true },
    ],
    mains: [
      { name: 'Вок с говядиной и удоном', description: 'На большом огне, соус терияки', factor: 0.4, weight: '420 г', allergens: ['глютен', 'соя'] },
      { name: 'Том Ям с креветками', description: 'Кокосовое молоко, лемонграсс', factor: 0.44, weight: '400 г', spicy: true, allergens: ['морепродукты'] },
      { name: 'Пад Тай', description: 'Рисовая лапша, тамаринд, арахис', factor: 0.36, weight: '380 г', allergens: ['орехи', 'яйцо'] },
      { name: 'Утка по-пекински', description: 'С блинчиками и соусом хойсин, полпорции', factor: 0.72, weight: '500 г', allergens: ['глютен', 'соя'] },
    ],
    desserts: [
      { name: 'Манго-стики райс', description: 'Клейкий рис, кокосовые сливки, манго', factor: 0.2, weight: '220 г', vegetarian: true },
    ],
  },
  'cui-european': {
    starters: [
      { name: 'Салат «Цезарь» с курицей', description: 'Ромэн, пармезан, домашний соус', factor: 0.26, weight: '260 г', allergens: ['молоко', 'яйцо', 'глютен'] },
      { name: 'Крем-суп из тыквы', description: 'С тыквенным маслом и семечками', factor: 0.2, weight: '300 г', vegetarian: true, allergens: ['молоко'] },
      { name: 'Сырная тарелка', description: 'Пять сортов, мёд, орехи, виноград', factor: 0.42, weight: '250 г', vegetarian: true, allergens: ['молоко', 'орехи'] },
    ],
    mains: [
      { name: 'Стейк рибай', description: 'Мраморная говядина, прожарка на выбор', factor: 0.95, weight: '320 г' },
      { name: 'Дорадо на гриле', description: 'Целиком, с лимоном и травами', factor: 0.62, weight: '400 г', allergens: ['рыба'] },
      { name: 'Куриное филе конфи', description: 'Пюре на сливках, соус из белых грибов', factor: 0.42, weight: '340 г', allergens: ['молоко'] },
      { name: 'Бургер с говядиной', description: 'Котлета 200 г, чеддер, картофель фри', factor: 0.38, weight: '450 г', allergens: ['глютен', 'молоко'] },
    ],
    desserts: [
      { name: 'Чизкейк «Нью-Йорк»', description: 'Классический, с ягодным соусом', factor: 0.2, weight: '160 г', vegetarian: true, allergens: ['молоко', 'яйцо', 'глютен'] },
      { name: 'Шоколадный фондан', description: 'С жидким центром и мороженым', factor: 0.22, weight: '150 г', vegetarian: true, allergens: ['молоко', 'яйцо', 'глютен'] },
    ],
  },
  'cui-uzbek': {
    starters: [
      { name: 'Самса с говядиной', description: 'Из тандыра, 2 штуки', factor: 0.18, weight: '220 г', allergens: ['глютен'] },
      { name: 'Ачичук', description: 'Томаты, лук, острый перец', factor: 0.14, weight: '200 г', vegetarian: true, spicy: true },
    ],
    mains: [
      { name: 'Плов ферганский', description: 'Рис девзира, баранина, нут, изюм', factor: 0.4, weight: '400 г' },
      { name: 'Лагман ручной вытяжки', description: 'Домашняя лапша, овощи, говядина', factor: 0.36, weight: '450 г', allergens: ['глютен'] },
      { name: 'Шурпа из баранины', description: 'Наваристый бульон с овощами', factor: 0.34, weight: '400 г' },
    ],
    desserts: [
      { name: 'Халва домашняя', description: 'Кунжутная, с фисташкой', factor: 0.12, weight: '120 г', vegetarian: true, allergens: ['кунжут', 'орехи'] },
    ],
  },
  'cui-eastern': {
    starters: [
      { name: 'Хумус с питой', description: 'Нут, тахини, оливковое масло', factor: 0.2, weight: '220 г', vegetarian: true, allergens: ['кунжут', 'глютен'] },
      { name: 'Мезе-сет', description: 'Пять закусок на компанию', factor: 0.38, weight: '400 г', vegetarian: true },
    ],
    mains: [
      { name: 'Шаурма-платтер', description: 'Мясо, овощи, соусы, лепёшка', factor: 0.3, weight: '420 г', allergens: ['глютен'] },
      { name: 'Кебаб-микс', description: 'Три вида на углях с булгуром', factor: 0.52, weight: '450 г' },
    ],
    desserts: [
      { name: 'Пахлава', description: 'Фисташка, мёд, 3 кусочка', factor: 0.16, weight: '150 г', vegetarian: true, allergens: ['орехи', 'глютен'] },
    ],
  },
  'cui-american': {
    starters: [
      { name: 'Куриные крылья BBQ', description: 'В глазури, с соусом блю чиз', factor: 0.28, weight: '350 г', allergens: ['молоко'] },
      { name: 'Начос с чеддером', description: 'Сальса, гуакамоле, халапеньо', factor: 0.24, weight: '300 г', vegetarian: true, spicy: true, allergens: ['молоко'] },
    ],
    mains: [
      { name: 'Двойной чизбургер', description: 'Две котлеты, бекон, чеддер', factor: 0.42, weight: '480 г', allergens: ['глютен', 'молоко'] },
      { name: 'Рёбра в бурбон-глазури', description: 'Томятся 8 часов, картофель дольками', factor: 0.6, weight: '550 г' },
      { name: 'Филадельфия-сэндвич', description: 'Стейк-слайсы, лук, сыр', factor: 0.38, weight: '400 г', allergens: ['глютен', 'молоко'] },
    ],
    desserts: [
      { name: 'Брауни с мороженым', description: 'Тёплый, с шариком пломбира', factor: 0.2, weight: '200 г', vegetarian: true, allergens: ['молоко', 'яйцо', 'глютен'] },
    ],
  },
  'cui-author': {
    starters: [
      { name: 'Тартар из томленой говядины', description: 'Каперсы, желток, тост на закваске', factor: 0.4, weight: '160 г', allergens: ['яйцо', 'глютен'] },
      { name: 'Севиче из сибаса', description: 'Лайм, красный лук, кинза', factor: 0.44, weight: '150 г', allergens: ['рыба'] },
    ],
    mains: [
      { name: 'Дегустационный сет из 7 подач', description: 'Сезонное меню шефа, 2 часа', factor: 2.6, weight: '—' },
      { name: 'Утиная грудка с вишней', description: 'Розовая прожарка, соус из вишни', factor: 0.72, weight: '280 г' },
      { name: 'Чёрная треска мисо', description: 'Маринад 48 часов, соус мисо', factor: 0.86, weight: '260 г', allergens: ['рыба', 'соя'] },
    ],
    desserts: [
      { name: 'Десерт «Облепиха и белый шоколад»', description: 'Кислое, сладкое, хрустящее', factor: 0.28, weight: '140 г', vegetarian: true, allergens: ['молоко'] },
    ],
  },
  'cui-korean': {
    starters: [
      { name: 'Кимчи', description: 'Ферментированная пекинская капуста', factor: 0.14, weight: '150 г', vegetarian: true, spicy: true },
    ],
    mains: [
      { name: 'Токпокки', description: 'Рисовые клёцки в остром соусе', factor: 0.3, weight: '350 г', vegetarian: true, spicy: true },
      { name: 'Пибимпап', description: 'Рис, овощи, говядина, яйцо', factor: 0.36, weight: '420 г', allergens: ['яйцо', 'соя'] },
    ],
  },
  'cui-french': {
    starters: [
      { name: 'Луковый суп', description: 'С гренками и грюйером', factor: 0.24, weight: '320 г', vegetarian: true, allergens: ['молоко', 'глютен'] },
    ],
    mains: [
      { name: 'Киш лорен', description: 'Песочное тесто, бекон, сливки', factor: 0.3, weight: '250 г', allergens: ['глютен', 'молоко', 'яйцо'] },
    ],
    desserts: [
      { name: 'Эклер ассорти', description: 'Три вкуса на выбор', factor: 0.22, weight: '180 г', vegetarian: true, allergens: ['глютен', 'молоко', 'яйцо'] },
      { name: 'Круассан с миндалём', description: 'На французском масле 82%', factor: 0.14, weight: '110 г', vegetarian: true, allergens: ['глютен', 'молоко', 'орехи'] },
      { name: 'Тарт с лимонным курдом', description: 'Хрустящая основа, меренга', factor: 0.2, weight: '150 г', vegetarian: true, allergens: ['глютен', 'молоко', 'яйцо'] },
    ],
  },
  'cui-indian': {
    starters: [
      { name: 'Самоса с картофелем', description: 'Хрустящая выпечка, мята-чатни', factor: 0.16, weight: '180 г', vegetarian: true, allergens: ['глютен'] },
      { name: 'Пакора овощная', description: 'Баклажан, лук, нутовая мука, соус', factor: 0.2, weight: '200 г', vegetarian: true },
      { name: 'Tandoori-креветки', description: 'Йогуртовый маринад, специи', factor: 0.32, weight: '180 г', allergens: ['молоко', 'морепродукты'] },
    ],
    mains: [
      { name: 'Butter chicken', description: 'Курица в томатно-сливочном соусе, рис басмати', factor: 0.44, weight: '380 г', allergens: ['молоко'] },
      { name: 'Palak paneer', description: 'Шпинат, домашний сыр, специи', factor: 0.38, weight: '320 г', vegetarian: true, allergens: ['молоко'] },
      { name: 'Бирьяни с бараниной', description: 'Ароматный рис, специи, мясо', factor: 0.52, weight: '420 г' },
      { name: 'Dal makhani', description: 'Чёрная чечевица, сливки, масло гхи', factor: 0.34, weight: '300 г', vegetarian: true, allergens: ['молоко'] },
    ],
    desserts: [
      { name: 'Gulab jamun', description: 'Молочные шарики в сиропе, 3 шт.', factor: 0.16, weight: '120 г', vegetarian: true, allergens: ['молоко'] },
    ],
  },
  'cui-turkish': {
    starters: [
      { name: 'Мезе-сет', description: 'Хумус, бабагануш, лабне, лаваш', factor: 0.32, weight: '350 г', vegetarian: true, allergens: ['молоко', 'глютен'] },
      { name: 'Сигара börek', description: 'Трубочки с сыром и шpinatом, 4 шт.', factor: 0.22, weight: '200 г', vegetarian: true, allergens: ['глютен', 'молоко'] },
    ],
    mains: [
      { name: 'Adana kebab', description: 'Баранина на углях, булгур, лук', factor: 0.48, weight: '380 г' },
      { name: 'Doner-платтер', description: 'Мясо, овощи, соусы, лаваш', factor: 0.36, weight: '420 г', allergens: ['глютен'] },
      { name: 'Lahmacun', description: 'Тонкая лепёшка с мясом и зеленью', factor: 0.28, weight: '250 г', allergens: ['глютен'] },
      { name: 'Pide с сыром', description: 'Лодочка с сыром и яйцом', factor: 0.34, weight: '380 г', vegetarian: true, allergens: ['глютен', 'молоко', 'яйцо'] },
    ],
    desserts: [
      { name: 'Baklava', description: 'Фисташка, мёд, 3 кусочка', factor: 0.18, weight: '150 г', vegetarian: true, allergens: ['орехи', 'глютен'] },
    ],
  },
};

const DRINKS: DishTemplate[] = [
  { name: 'Эспрессо', description: 'Двойная порция на смеси дня', factor: 0.09, weight: '60 мл', vegetarian: true },
  { name: 'Капучино', description: 'На фермерском молоке, есть альтернативное', factor: 0.13, weight: '250 мл', vegetarian: true, allergens: ['молоко'] },
  { name: 'Раф на кедровых орехах', description: 'Фирменный, со сливками', factor: 0.16, weight: '300 мл', vegetarian: true, allergens: ['молоко', 'орехи'] },
  { name: 'Чайник облепихового чая', description: 'С имбирём и мёдом, 800 мл', factor: 0.18, weight: '800 мл', vegetarian: true },
  { name: 'Свежевыжатый апельсиновый сок', description: 'Отжимаем при вас', factor: 0.15, weight: '300 мл', vegetarian: true },
  { name: 'Лимонад домашний', description: 'Три вкуса на выбор', factor: 0.13, weight: '400 мл', vegetarian: true },
];

const BAR_ITEMS: DishTemplate[] = [
  { name: 'Авторский коктейль дня', description: 'Спросите у бармена — меняется еженедельно', factor: 0.3, weight: '200 мл' },
  { name: 'Негрони', description: 'Джин, кампари, вермут', factor: 0.32, weight: '120 мл' },
  { name: 'Крафтовое пиво', description: 'Шесть кранов собственной варки', factor: 0.22, weight: '500 мл', allergens: ['глютен'] },
  { name: 'Бокал красного сухого', description: 'Позиция месяца из винной карты', factor: 0.34, weight: '150 мл' },
  { name: 'Апероль Шприц', description: 'Просекко, апероль, апельсин', factor: 0.3, weight: '300 мл' },
];

const BAKING: DishTemplate[] = [
  { name: 'Круассан классический', description: 'Слоёное тесто на масле 82%', factor: 0.12, weight: '90 г', vegetarian: true, allergens: ['глютен', 'молоко'] },
  { name: 'Синнабон с корицей', description: 'Тёплая булочка с кремом', factor: 0.15, weight: '140 г', vegetarian: true, allergens: ['глютен', 'молоко'] },
  { name: 'Хлеб на закваске', description: 'Целая буханка, выпекаем каждое утро', factor: 0.16, weight: '600 г', vegetarian: true, allergens: ['глютен'] },
];

const SECTION_PLAN: Record<string, SectionKey[]> = {
  'cat-restaurant': ['starters', 'mains', 'desserts', 'drinks', 'bar'],
  'cat-cafe': ['starters', 'mains', 'desserts', 'drinks'],
  'cat-bar': ['starters', 'mains', 'bar', 'drinks'],
  'cat-coffee': ['baking', 'desserts', 'drinks'],
  'cat-banquet': ['starters', 'mains', 'desserts', 'drinks'],
  'cat-karaoke': ['starters', 'mains', 'bar', 'drinks'],
  'cat-lounge': ['starters', 'mains', 'bar', 'drinks'],
  'cat-club': ['starters', 'bar', 'drinks'],
  'cat-bakery': ['baking', 'desserts', 'drinks'],
  'cat-loft': ['starters', 'mains', 'desserts', 'bar'],
};

function roundPrice(value: number) {
  if (value >= 10000) return Math.round(value / 500) * 500;
  if (value >= 2000) return Math.round(value / 100) * 100;
  return Math.round(value / 50) * 50;
}

export function buildMenu(venue: Venue): Menu {
  const random = createRandom(hashString(`${venue.slug}-menu`));
  const sectionKeys = SECTION_PLAN[venue.categoryId] ?? ['starters', 'mains', 'desserts', 'drinks'];

  const sections: MenuSection[] = sectionKeys.map((key, index) => ({
    id: `${venue.slug}-section-${key}`,
    venueId: venue.id,
    name: SECTION_TITLES[key],
    order: index,
    createdAt: NOW,
    updatedAt: NOW,
  }));

  const items: MenuItem[] = [];

  sectionKeys.forEach((key) => {
    let pool: DishTemplate[] = [];

    if (key === 'drinks') pool = DRINKS;
    else if (key === 'bar') pool = BAR_ITEMS;
    else if (key === 'baking') pool = BAKING;
    else {
      venue.cuisineIds.forEach((cuisineId) => {
        pool.push(...(DISHES_BY_CUISINE[cuisineId]?.[key] ?? []));
      });
      // Запасной вариант, если для кухни нет блюд в этой секции.
      if (pool.length === 0) pool = DISHES_BY_CUISINE['cui-european'][key] ?? [];
    }

    const uniquePool = pool.filter(
      (dish, index, all) => all.findIndex((d) => d.name === dish.name) === index,
    );
    const count = Math.min(uniquePool.length, key === 'mains' ? 6 : 4);
    const selected = pickMany(uniquePool, count, random);

    selected.forEach((dish, index) => {
      items.push({
        id: `${venue.slug}-dish-${key}-${index}`,
        venueId: venue.id,
        sectionId: `${venue.slug}-section-${key}`,
        name: dish.name,
        description: dish.description,
        price: roundPrice(venue.averagePrice * dish.factor),
        weight: dish.weight,
        image:
          random() > 0.45
            ? `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop&q=80&sig=${venue.slug}-${key}-${index}`
            : undefined,
        isPopular: index === 0 || random() > 0.78,
        isVegetarian: Boolean(dish.vegetarian),
        isSpicy: Boolean(dish.spicy),
        allergens: dish.allergens ?? [],
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
  });

  return { venueId: venue.id, sections, items };
}
