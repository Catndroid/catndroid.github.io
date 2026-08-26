/* ---------- 每日新闻（少数派 RSS） ----------
   纯前端实现：拉取 → 解析 → 本地缓存 → 渲染
   由于静态站直接 fetch 受跨域限制，直连失败会自动降级到多个 CORS 代理 */
(function () {
  'use strict';

  const FEED = 'https://sspai.com/feed';
  const CACHE_KEY = 'catmy_news_v1';
  const CACHE_TTL = 6 * 60 * 60 * 1000; // 缓存 6 小时
  const MAX_ITEMS = 10;

  /* 依次尝试的取数通道：直连 → 各代理 */
  const CHANNELS = [
    { label: '直连', build: u => u },
    { label: 'allorigins', build: u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
    { label: 'corsproxy', build: u => 'https://corsproxy.io/?url=' + encodeURIComponent(u) },
    { label: 'codetabs', build: u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u) },
  ];

  const escapeHtml = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const $ = sel => document.querySelector(sel);

  /* 时间友好化 */
  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diff = now - d.getTime();
    const pad = n => String(n).padStart(2, '0');
    if (diff > 0 && diff < 60 * 60 * 1000) return Math.max(1, Math.round(diff / 60000)) + ' 分钟前';
    if (diff > 0 && diff < 24 * 60 * 60 * 1000) return Math.round(diff / 3600000) + ' 小时前';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /* 去掉描述里的 HTML 标签 */
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* 本地缓存（localStorage 不可用时静默降级） */
  const store = {
    get() {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.time > CACHE_TTL) return null;
        return data;
      } catch (_) { return null; }
    },
    set(items) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), items })); } catch (_) {}
    }
  };

  /* 拉取 Feed 文本 */
  async function fetchFeed() {
    for (const ch of CHANNELS) {
      try {
        const res = await fetch(ch.build(FEED), { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        if (text && /<rss|<feed|<rdf/i.test(text)) return text;
      } catch (_) { /* 尝试下一个通道 */ }
    }
    throw new Error('无法连接到少数派 Feed');
  }

  /* 解析 RSS → 条目数组 */
  function parseRss(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('Feed 解析失败');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, MAX_ITEMS).map(item => {
      const get = sel => {
        const el = item.querySelector(sel);
        return el ? el.textContent.trim() : '';
      };
      return {
        title: get('title'),
        link: get('link'),
        date: get('pubDate'),
        desc: stripHtml(get('description')).slice(0, 140),
      };
    }).filter(it => it.title && it.link);
    if (!items.length) throw new Error('Feed 中没有任何内容');
    return items;
  }

  /* 渲染列表 */
  function render(items) {
    const list = $('#news-list');
    if (!list) return;
    list.innerHTML = items.map(it => `
      <a class="news-item" href="${escapeHtml(it.link)}" target="_blank" rel="noopener">
        <span class="news-item-main">
          <span class="news-item-title">${escapeHtml(it.title)}</span>
          ${it.desc ? `<span class="news-item-desc">${escapeHtml(it.desc)}</span>` : ''}
        </span>
        <span class="news-item-date">${escapeHtml(fmtDate(it.date))}</span>
      </a>
    `).join('');
  }

  /* 状态提示 */
  function setStatus(cls, msg) {
    const list = $('#news-list');
    if (!list) return;
    list.innerHTML = `<div class="news-status ${cls}">${msg}</div>`;
  }

  /* 主流程 */
  async function loadNews(force) {
    const list = $('#news-list');
    if (!list) return;
    const refreshBtn = $('#news-refresh');
    if (refreshBtn) refreshBtn.disabled = true;

    /* 有缓存且非强制刷新 → 直接用缓存 */
    const cached = store.get();
    if (!force && cached && cached.items && cached.items.length) {
      render(cached.items);
      if (refreshBtn) refreshBtn.disabled = false;
      return;
    }

    setStatus('loading', '正在加载每日新闻…');
    try {
      const xml = await fetchFeed();
      const items = parseRss(xml);
      store.set(items);
      render(items);
    } catch (err) {
      setStatus('error', `每日新闻加载失败：${escapeHtml(err.message)}`);
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  /* 初始化 */
  function init() {
    const section = $('#news-section');
    if (!section) return;
    const refreshBtn = $('#news-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadNews(true));
    loadNews(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
