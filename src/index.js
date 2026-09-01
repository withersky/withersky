/* withersky Worker: раздаёт статику + ночная пересборка по cron */

export default {
  // Обычные запросы → отдаём статические файлы сайта
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  // Ночью (cron) дёргаем деплой-хук → Workers Builds пересобирает проект
  async scheduled(event, env) {
    const hook = env.DEPLOY_HOOK_URL;
    if (!hook) {
      console.error('DEPLOY_HOOK_URL не задан');
      return;
    }
    const res = await fetch(hook, { method: 'POST' });
    console.log('Пересборка запущена, статус:', res.status);
  },
};
