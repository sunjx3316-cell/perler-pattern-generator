# 色库来源与覆盖范围

核对日期：2026-10-01。RGB 是屏幕参考色，即使官方发布的 RGB 也不代表所有生产批次的实物颜色。

| 选项 | 收录 | 来源 | 限制 |
| --- | --- | --- | --- |
| MARD | 221 | maxcleme/beadcolors 社区采样 RGB | A–H、M 基础色号，未找到完整官方数字 RGB 表 |
| Perler 5mm | 103 | 同上 | 使用真实 80-xxxxx 产品色号；不是全部最新在售商品 |
| Artkal S 5mm | 173 | 官方 2024 RGB PDF | S01–S159（不含无 RGB 的 S41、S42、S63）及 SE01–SE17 |
| Artkal C 2.6mm | 172 | 官方 2024 RGB PDF | C01–C157（不含无 RGB 的 C35 与异常 C152）及 CE01–CE17 |
| Hama Midi 5mm | 92 | 社区 RGB + 官方色卡核对编号 | H01 对应官方 01；含特殊材质参考色；不是完整最新目录 |

## 官网与原始数据

- MARD 官方账号：https://www.weibo.com/marbead 。原项目键名为 mard，编号结构与 MARD 基础色卡一致；原来的“通用拼豆”命名误导。原 RGB 未记录来源，现替换为有贡献者署名的社区采样参考值，不声称是官方数值。
- Perler 官方商品目录：https://perler.com/collections/shop-by-color 。官方色卡：https://perler.com/content/uploaded_images/Perler_Bead-Color-Reference_2025.pdf 。未发现完整数值 RGB；不能把商品编号当 RGB，也不使用伪造的 P 系列编号。
- Artkal S 官方下载页：https://www.artkalfusebeads.com/pages/s-color-chart 。RGB：https://cdn.shopify.com/s/files/1/1323/8195/files/S_MIDI_Beads_RGB_Color_Chart_2024.pdf?v=1744686607
- Artkal C 官方下载页：https://www.artkalfusebeads.com/pages/c-color-chart 。RGB：https://cdn.shopify.com/s/files/1/1323/8195/files/C_MINI_Beads_RGB_Color_Chart_2024.pdf?v=1744700289
- Hama 官方色卡：https://www.hama.dk/media/102242/colour-chart.pdf 。官网：https://hama.dk/ 。公开色卡列编号、名称和照片，没有完整数值 RGB。
- 社区参考库：https://github.com/maxcleme/beadcolors 。实际导入 master/raw/mard.csv、perler.csv、hama.csv；每条保留 contributor 字段。MIT 许可证见 THIRD_PARTY_NOTICES.md。

## 不确定与缺失项处理

Artkal 官网声称 S 225 色、C 197 色，但其 RGB PDF 数值覆盖范围更小，不能将这两个商品总数冒充已收录 RGB 数量。S41 Gold、S42 Silver、S63 Copper、C35 Silver 没有 RGB，未编造值。C152 官方 PDF 印刷为 189,199,273，蓝通道越界，暂不收录，未擅自截断至 255。

透明、夜光、金属、珠光等颜色无法用单一 RGB 表现材质。社区数据中按名称识别这些颜色，保留手动选择，但不参与自动匹配。官方未提供数值的特殊色没有加入。Perler 103 色快照不包含全部特殊色，不宣称全品牌全系列完整覆盖。

MARD 下拉选项使用真实 A1 等编号，搜索兼容 A01 写法。切换品牌会重新生成图纸，并清空旧品牌的画笔、复制颜色和撤销历史，避免混入另一品牌的色号。
