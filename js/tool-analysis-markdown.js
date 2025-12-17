/* ---------- 工具函数 ---------- */
const escapeHtml = str => str
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;');

/* ---------- emoji 表 ---------- */
const emojiMap = {
  smile:'😄', heart:'❤️', fire:'🔥', ok:'👌',
  joy:'😂', sob:'😭', yum:'😋', kiss:'😘',
  tada:'🎉',thumbsup:'👍',wave:'👋'
};

/* ---------- 行内 Markdown 解析（不破坏已有 HTML 标签） ---------- */
function parseInline(s){
  /* 已保护好的标签占位符 */
  const holders = [];
  let idx = 0;
  const protector = str => `{@@${idx++}@@}`;
  const restore = text => {
    holders.forEach(h => text = text.replace(h.holder, h.txt));
    return text;
  };

  /* 1. 保护已有 HTML 标签 */
  s = s.replace(/<[^>]+>/g, tag => {
    const h = protector();
    holders.push({holder:h, txt:tag});
    return h;
  });

  /* 2. 行内语法 */
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/:([a-z]+):/g, (_,k) => {
    const e = emojiMap[k];
    return e ? `<span class="emoji">${e}</span>` : `:${k}:`;
  });


  /* 3. 还原标签 */
  return restore(s);
}

/* ---------- 主解析入口 ---------- */
function parseSpecialMd(md){
  const lines = md.split(/\n/);
  let buffer = '';
  let html   = '';
  const flush = () => {
    if(!buffer.trim()) return;
    /* 对非 HTML 块简单处理：段落、标题、列表 */
    let block = buffer
      .replace(/^### (.*)/gm, '<h3>$1</h3>')
      .replace(/^## (.*)/gm,  '<h2>$1</h2>')
      .replace(/^# (.*)/gm,   '<h1>$1</h1>')
      .replace(/^\* (.+)/gm,  '<li>$1</li>')
      .replace(/^(\s*<li>.*<\/li>)+/gim, m=>`<ul>${m}</ul>`)
      .replace(/\n{2,}/g, '\n</p><p>')
      .replace(/^([^<].*)/gm, '<p>$1</p>');
    /* 行内再跑一次 */
    block = block.split(/(<[^>]+>)/).map(c=> c.startsWith('<')? c : parseInline(c)).join('');
    html += `<div class="parts">${block}</div>`;
    buffer = '';
  };

  for(const line of lines){
    if(line.trim() === '<!--part-->'){ flush(); continue; }
    buffer += line + '\n';
  }
  flush();
  return html;
}

/* ---------- 渲染 ---------- */
function renderMarkdown(){
  const pool = document.getElementById('md-pool');
  const target = document.getElementById('md-target');
  if(!pool || !target) return;
  target.innerHTML = parseSpecialMd(pool.innerHTML);
}

/* ---------- 启动 ---------- */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', renderMarkdown);
}else{
  renderMarkdown();
}