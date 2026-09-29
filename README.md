# physicsmp-lab
PhysicsMP Lab 是一个面向学生和教师的物理仿真小实验网站。 通过调节参数、观察图像和比较数值，让公式背后的物理过程真正可视化。

仅供教学、学习与非商业交流使用。

未经作者书面许可，不得将本项目的源代码、页面设计、
交互实验或其修改版本用于商业用途、商业产品或商业服务。

如需转载、二次开发或商业使用，请联系作者获得授权。


### 舰载机起飞实验

新增 `programs/舰载机起飞.html`，已加入首页和力学模块。支持弹射/航行双方案三维对比、参数调节、时间拖动、播放暂停、全屏及航母平移增强。公式采用原生 MathML；Three.js r158 与 OrbitControls 本地加载（MIT 许可位于 `assets/vendor/three-LICENSE.txt`）。增强显示不改变物理计算。

浏览器验证：环境提供 Playwright 与 Microsoft Edge 后，在仓库根目录执行 `node tests/carrier-browser.cjs`。

### 追及相遇实验

新增 `programs/追及相遇.html`，支持汽车与自行车的位置动画、速度与位置差图像、参数调节、时间拖动、关键时刻自动暂停和全屏演示。原题在 2 s 时相距最远 6 m，在 4 s 时于 24 m 处追上，汽车速度 12 m/s。

首页精选保留追及相遇、舰载机起飞、匀变速直线运动与机械能守恒四个实验；全部六个实验仍可通过力学模块访问。

验证：`node --test tests/pursuit.test.cjs`；环境提供 Playwright 与 Microsoft Edge 后执行 `node tests/pursuit-browser.cjs` 和 `node tests/homepage-browser.cjs`。

## 闭合电路内外电压实验

新增电磁学模块，首页共有 7 个实验。进入“电磁学”可打开“闭合电路内外电压”。支持两组控制变量、液面和滑动变阻器调节、电压表与图像同步、自动演示、断路观察、全屏和 CSV 数据导出，可离线运行。

验证：`node --test tests/circuit.test.cjs`；安装 Playwright 且提供 Edge 后运行 `node tests/circuit-browser.cjs`。
