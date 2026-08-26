/* ============================================================
 * Markdown 渲染模块 —— 基于 marked v12（本地 js/marked.min.js）
 *
 * 旧版为手写解析器，无法完整渲染标准 Markdown；
 * 现改用 marked：支持 GFM、表格、任务列表、代码块、混写 HTML 等。
 *
 * 保留原接口：renderMarkdown()
 *   - 读取 #md-pool 中的 Markdown 源码（纯文本）
 *   - 渲染到 #md-target
 *
 * 分段语法：<!--part--> 会把文章拆成多个 <div class="parts"> 卡片
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- emoji 表（:xxx: 语法） ---------- */
  const emojiMap = {
    smile: '😄', heart: '❤️', fire: '🔥', ok: '👌',
    joy: '😂', sob: '😭', yum: '😋', kiss: '😘',
    tada: '🎉', thumbsup: '👍', wave: '👋'
  };

  /* 在文本节点里替换 :xxx: 为 emoji（自动跳过代码块/行内代码） */
  function replaceEmojiInTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement && node.parentElement.closest('pre, code')) return;
      node.nodeValue = node.nodeValue.replace(/:([a-z0-9_+-]+):/gi, (m, k) => emojiMap[k.toLowerCase()] || m);
    });
  }

  /* 渲染后的收尾：链接新窗口打开、图片自适应宽度、emoji 处理 */
  function postProcess(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;

    wrap.querySelectorAll('a[href]').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    wrap.querySelectorAll('img').forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });

    replaceEmojiInTextNodes(wrap);

    return wrap.innerHTML;
  }

  /* 用 marked 渲染单个 part */
  function renderPart(md) {
    if (!md || !md.trim()) return '';
    let html;
    try {
      html = marked.parse(md, { gfm: true, breaks: false, async: false });
    } catch (err) {
      console.error('[MarkdownRender] 解析失败：', err);
      html = '<p>（这一段解析失败了，看看源文件？）</p>';
    }
    return postProcess(html);
  }

  /* 主解析：按 <!--part--> 分段，逐段渲染并包成 .parts 卡片 */
  function parseSpecialMd(md) {
    return String(md)
      .split('<!--part-->')
      .map(part => {
        const body = renderPart(part);
        return body ? `<div class="parts">${body}</div>` : '';
      })
      .join('');
  }

  /* 渲染入口（被 tool-markdown-provider*.js 调用） */
  function renderMarkdown() {
    const pool = document.getElementById('md-pool');
    const target = document.getElementById('md-target');
    if (!pool || !target) return;
    target.innerHTML = parseSpecialMd(pool.textContent || '');
  }

  /* 暴露给外部脚本（原为全局函数） */
  window.renderMarkdown = renderMarkdown;

  /* 启动 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMarkdown);
  } else {
    renderMarkdown();
  }
})();
