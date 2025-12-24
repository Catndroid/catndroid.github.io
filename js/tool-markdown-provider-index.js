(function(){
  const mdUrl = '/article/' + '/index.md?v=' + Date.now();
  fetch(mdUrl)
    .then(r => {
      if(!r.ok) throw new Error('index.md 不存在或网络错误');
      return r.text();
    })
    .then(text => {
      const pool = document.getElementById('md-pool');
      if(!pool){ console.warn('缺少 #md-pool，无法写入 Markdown'); return; }
      pool.innerHTML = text;   // 写入隐藏池
      renderMarkdown();        // 调用你已有的解析函数
    })
    .catch(err => {
      const target = document.getElementById('md-target');
      if(target) target.innerHTML = `<div class="parts">这里什么也没有，要不然换个地方玩玩?<br>错误在于: ${err.message}</p></div>`;
      console.error('[MarkdownLoader]', err);
    });
})();