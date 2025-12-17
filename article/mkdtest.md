# Markdown 解析性能测试（300 行完整文本）

> 本样本约 300 行，10 kB，含代码块、表格、嵌套列表、引用、脚注、emoji 等典型元素。  
> 可直接保存为 `sample-300.md`，用于 bench.js / bench.php 复现。

<!--part-->

## 1 测试目标

对比主流解析器在 **300 行技术文档** 场景下的：

1. 解析速度（ms/次）
2. 峰值内存（MB）
3. CPU 占用（%）

<!--part-->

## 2 样本结构概览

| 元素类型   | 数量 |
|------------|------|
| 二级标题   | 20   |
| 代码块     | 12   |
| GFM 表格   | 3    |
| 嵌套列表   | 5 层 |
| 引用       | 6    |
| 脚注       | 4    |
| Emoji      | 10   |

<!--part-->

## 3 开始样本

### 2.1 标题与段落

Lorem ipsum dolor sit amet, consectetur adipiscing elit.  
Pellentesque **bold** et *italic* massa.

#### 2.1.1 子标题

Vestibulum `inline code` lectus.

<!--part-->

### 2.2 代码块（12 段）

<pre>
// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}</pre>
