# physicsmp-lab
PhysicsMP Lab 是一个面向学生和教师的物理仿真小实验网站。 通过调节参数、观察图像和比较数值，让公式背后的物理过程真正可视化。

仅供教学、学习与非商业交流使用。

未经作者书面许可，不得将本项目的源代码、页面设计、
交互实验或其修改版本用于商业用途、商业产品或商业服务。

如需转载、二次开发或商业使用，请联系作者获得授权。


### 舰载机起飞实验

新增 `programs/舰载机起飞.html`，已加入首页和力学模块。支持弹射/航行双方案三维对比、参数调节、时间拖动、播放暂停、全屏及航母平移增强。公式采用原生 MathML；Three.js r158 与 OrbitControls 本地加载（MIT 许可位于 `assets/vendor/three-LICENSE.txt`）。增强显示不改变物理计算。

浏览器验证：环境提供 Playwright 与 Microsoft Edge 后，在仓库根目录执行 `node tests/carrier-browser.cjs`。
