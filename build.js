'use strict';

const fs = require('fs');
const path = require('path');

const INPUT = 'repos.json';
const OUTPUT = 'projects.json';
const GITHUB_API = 'https://api.github.com';

async function main() {
  // 1. Читаем входной файл
  const input = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  const { profile, repos } = input;

  // 2. Настраиваем заголовки для GitHub API
  const headers = { Accept: 'application/vnd.github.v3+json' };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('🔑  Использую GITHUB_TOKEN');
  } else {
    console.log('⚠️  Без токена — 60 запросов/час. Рекомендую задать GITHUB_TOKEN.');
  }

  // 3. Обогащаем каждый репозиторий
  const projects = [];

  for (const slug of repos) {
    const [owner, repo] = slug.split('/');
    const url = `https://github.com/${slug}`;

    try {
      process.stdout.write(`📡  ${slug} … `);
      const res = await fetch(`${GITHUB_API}/repos/${slug}`, { headers });

      if (!res.ok) {
        console.warn(`⚠️  HTTP ${res.status}`);
        projects.push({ name: repo, description: null, language: null, stars: 0, homepage: null, url, updated: null });
        continue;
      }

      const data = await res.json();
      projects.push({
        name: data.name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        homepage: data.homepage || null,
        url: data.html_url,
        updated: data.updated_at ? data.updated_at.slice(0, 10) : null,
      });
      console.log('✅');
    } catch (err) {
      console.warn(`⚠️  ${err.message}`);
      projects.push({ name: repo, description: null, language: null, stars: 0, homepage: null, url, updated: null });
    }
  }

  // 4. Пишем projects.json
  const output = { profile, projects };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`\n✅  ${OUTPUT} сгенерирован: ${projects.length} проектов`);
}

main().catch((err) => {
  console.error('❌  Ошибка:', err.message);
  process.exit(1);
});