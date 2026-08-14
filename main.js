/* ============================================================
   withersky.github.io — логика портфолио
   Рендер карточек, фильтры-«листы», статистика, график вклада
   ============================================================ */

'use strict';

/* Цвета языков — как у github.com/colored */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Shell: '#89e051',
  QML: '#44a51c',
  ASL: '#8b949e',
  YAML: '#cb171e',
  RobotFramework: '#00c0b0',
};

const LANGUAGE_ICONS = {
  JavaScript: '⚡',
  Python: '🐍',
  Rust: '🦀',
  Shell: '🐚',
  QML: '🧩',
  ASL: '💾',
  YAML: '⚙️',
  RobotFramework: '🤖',
};

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/* Резервные данные — используются, если projects.json недоступен */
const FALLBACK = {
  profile: {
    login: 'withersky',
    name: 'Nikita V.',
    avatar: 'https://avatars.githubusercontent.com/u/55928929?v=4',
    github: 'https://github.com/withersky',
  },
  projects: [
    {
      name: 'tabula-plugin',
      description: 'Новая вкладка как электронная таблица: листы, темы, часы, погода, фон',
      language: 'JavaScript',
      stars: 1,
      homepage: 'https://withersky.github.io/tabula-plugin/',
      url: 'https://github.com/withersky/tabula-plugin',
      updated: '2026-08-04',
    },
    {
      name: 'ucleaner',
      description: 'Очиститель кэша и временных файлов для deb-дистрибутивов Linux',
      language: 'Python',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/ucleaner',
      updated: '2026-04-03',
    },
    {
      name: 'scrcpy-gui',
      description: 'GUI для scrcpy — управление Android по ADB через WiFi',
      language: 'Python',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/scrcpy-gui',
      updated: '2026-04-03',
    },
    {
      name: 'foreigncurrencies',
      description: 'Плазмоид KDE: курсы иностранных валют в реальном времени',
      language: 'QML',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/foreigncurrencies',
      updated: '2026-03-21',
    },
    {
      name: 'thinkpad-t480-efi-sonoma',
      description: 'Готовая EFI-конфигурация для macOS Sonoma на ThinkPad T480',
      language: 'ASL',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/thinkpad-t480-efi-sonoma',
      updated: '2024-09-10',
    },
    {
      name: 'tftpd-manager',
      description: 'Интерактивное консольное меню для управления tftpd-сервером',
      language: 'Shell',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/tftpd-manager',
      updated: '2026-03-05',
    },
    {
      name: 'padavan-builder-workflow',
      description: 'Автоматическая сборка прошивки Padavan в GitHub Actions — для TP-Link TL-WR841N v13',
      language: 'YAML',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/padavan-builder-workflow',
      updated: '2026-02-15',
    },
    {
      name: 'Withersky-Tech-Fetch',
      description: 'Форк screenfetch/neofetch — информация о системе в терминале',
      language: 'Shell',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/Withersky-Tech-Fetch',
      updated: '2024-09-12',
    },
    {
      name: 'bc-testing',
      description: 'BC-тесты для Linux, написанные на Robot Framework',
      language: 'RobotFramework',
      stars: 0,
      homepage: null,
      url: 'https://github.com/withersky/bc-testing',
      updated: '2022-07-28',
    },
  ],
};

let currentLanguage = 'Все';

/* ---------- Загрузка данных ---------- */

async function loadData() {
  try {
    const res = await fetch('projects.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('projects.json недоступен, использую резервные данные:', err);
    return FALLBACK;
  }
}

/* ---------- Хелперы ---------- */

function sortedProjects(projects) {
  return [...projects].sort((a, b) => (b.stars - a.stars) || (b.updated > a.updated ? 1 : -1));
}

function uniqueLanguages(projects) {
  return [...new Set(projects.map((p) => p.language))].filter(Boolean).sort();
}

function formatUpdated(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------- Статистика ---------- */

function renderStats(data) {
  const projects = data.projects || [];
  document.getElementById('statRepos').textContent = projects.length;
  document.getElementById('statLanguages').textContent = uniqueLanguages(projects).length;
  document.getElementById('statStars').textContent = projects.reduce((sum, p) => sum + (p.stars || 0), 0);
}

/* ---------- Листы-фильтры ---------- */

function renderSheets(data) {
  const tabsBox = document.getElementById('sheetTabs');
  tabsBox.textContent = '';
  const languages = ['Все', ...uniqueLanguages(data.projects || [])];

  languages.forEach((language) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'sheet-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(language === currentLanguage));
    tab.dataset.language = language;

    const dot = document.createElement('span');
    dot.className = 'lang-dot';
    dot.style.background = LANGUAGE_COLORS[language] || 'rgba(255,255,255,0.25)';
    tab.appendChild(dot);

    const label = document.createElement('span');
    label.textContent = language;
    tab.appendChild(label);

    tab.addEventListener('click', () => {
      currentLanguage = language;
      renderSheets(data);
      renderProjects(data, language);
    });

    tabsBox.appendChild(tab);
  });
}

/* ---------- Карточки проектов ---------- */

function buildCard(project, index) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.style.setProperty('--i', index);

  /* Шапка: название + бейдж языка */
  const head = document.createElement('div');
  head.className = 'project-card-head';

  const name = document.createElement('h3');
  name.className = 'project-name';
  const nameLink = document.createElement('a');
  nameLink.href = project.url || '#';
  nameLink.target = '_blank';
  nameLink.rel = 'noopener';
  nameLink.textContent = project.name;
  name.appendChild(nameLink);

  const badge = document.createElement('span');
  badge.className = 'lang-badge';
  const dot = document.createElement('span');
  dot.className = 'lang-dot';
  dot.style.background = LANGUAGE_COLORS[project.language] || 'rgba(255,255,255,0.25)';
  badge.appendChild(dot);
  badge.appendChild(document.createTextNode(project.language));

  head.appendChild(name);
  head.appendChild(badge);

  /* Описание */
  const desc = document.createElement('p');
  desc.className = 'project-desc';
  desc.textContent = project.description || 'Без описания';

  /* Мета: звёзды + дата обновления */
  const meta = document.createElement('div');
  meta.className = 'project-meta';

  const stars = document.createElement('span');
  stars.className = 'stars';
  stars.textContent = '★ ' + (project.stars || 0);

  const updated = document.createElement('span');
  updated.textContent = 'обновлено ' + formatUpdated(project.updated);

  meta.appendChild(stars);
  meta.appendChild(updated);

  /* Действия */
  const actions = document.createElement('div');
  actions.className = 'project-actions';

  const repo = document.createElement('a');
  repo.className = 'action-repo';
  repo.href = project.url || '#';
  repo.target = '_blank';
  repo.rel = 'noopener';

  const NS = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(NS, 'svg');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('fill', 'currentColor');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z');
  icon.appendChild(path);

  repo.appendChild(icon);
  repo.appendChild(document.createTextNode('GitHub'));
  actions.appendChild(repo);

  if (project.homepage) {
    const site = document.createElement('a');
    site.className = 'action-site';
    site.href = project.homepage;
    site.target = '_blank';
    site.rel = 'noopener';
    site.textContent = 'Сайт';
    actions.appendChild(site);
  }

  card.appendChild(head);
  card.appendChild(desc);
  card.appendChild(meta);
  card.appendChild(actions);
  return card;
}

function renderProjects(data, language) {
  const grid = document.getElementById('projectGrid');
  grid.textContent = '';
  const all = sortedProjects(data.projects || []);
  const list = language && language !== 'Все'
    ? all.filter((p) => p.language === language)
    : all;

  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'section-sub';
    empty.textContent = 'Здесь пока пусто — загляните позже.';
    grid.appendChild(empty);
    return;
  }

  list.forEach((project, i) => {
    grid.appendChild(buildCard(project, i));
  });
}

/* ---------- График вклада ---------- */

function setupGHChart() {
  const img = document.getElementById('ghChart');
  if (!img) return;
  img.addEventListener('error', () => {
    img.remove();
    const caption = document.querySelector('.github-card-caption');
    if (caption) caption.textContent = 'График вклада временно недоступен';
  });
}

/* ---------- Фоновое изображение Bing ---------- */

const BING_FALLBACK =
  'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=ru-RU';

async function setupBackground() {
  const el = document.getElementById('bgImage');
  if (!el) return;

  const setImage = (url) => {
    el.style.backgroundImage = `url("${url}")`;
  };

  try {
    const res = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=ru-RU');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const url = data && data.url;
    if (url) setImage(url);
  } catch (err) {
    console.warn('Не удалось загрузить Bing-фон, использую резервный URL:', err);
    setImage(BING_FALLBACK);
  }
}

/* ---------- Инициализация ---------- */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData();

  renderStats(data);
  renderSheets(data);
  renderProjects(data, currentLanguage);
  setupGHChart();
  setupBackground();

  const brandImg = document.querySelector('.brand img');
  if (brandImg && data.profile && data.profile.avatar) {
    brandImg.src = data.profile.avatar;
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
