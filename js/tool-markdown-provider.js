(function(){
  /* 1. 取参数 */
  const params = new URLSearchParams(location.search);
  const mdFile = params.get('article');
  if(!mdFile) return;

  /* 2. 拼接路径并获取 */
  const mdUrl = '/article/' + mdFile.replace(/^\/+|\/+$/g,'');
  fetch(mdUrl)
    .then(r => {
      if(!r.ok) throw new Error('找不到文章');
      return r.text();
    })
    .then(text => {
      /* 3. 塞进隐藏池并渲染 */
      const pool = document.getElementById('md-pool');
      if(!pool){
        console.warn('缺少 #md-pool，无法写入远程 Markdown');
        return;
      }
      pool.innerHTML = text;   // 写入源码池
      renderMarkdown();        // 调用你已有的解析函数
    })
    .catch(err => {
      /* 4. 简单错误提示 */
      const target = document.getElementById('md-target');
      if(target) target.innerHTML = `<div class="parts">这里什么也没有，要不然换个地方玩玩?<br>错误在于: ${err.message}</p></div>`;
      console.error('[MarkdownLoader]', err);
    });
})();