# OpenLayers + 天地图地图Demo规格说明书

## 1. 项目概述

- **项目名称**: openlayers-tianditu-demo
- **项目类型**: 交互式地图预览
- **核心功能**: 使用OpenLayers加载天地图，实现缩放控制和文字标注显示
- **目标用户**: 开发者/产品人员预览地图效果

## 2. 视觉与渲染规格

### 地图配置
- **投影方式**: 墨卡托投影 (EPSG:3857)
- **中心点**: 中国区域 [104.0, 35.0]
- **初始缩放级别**: 5
- **最小缩放级别**: 3
- **最大缩放级别**: 18

### 图层配置
- **底图图层**: 天地图地形晕渲图层 (img表示影像-地形)
  - URL模板: `https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=你的天地图token`
  - 墨卡托投影TileGrid
- **标注图层**: 天地图文字标注叠加层
  - URL模板: `https://t0.tianditu.gov.cn/cia_w/wmts?...` (标注层)

### 地图控件
- 缩放控件 (Zoom)
- 滚轮缩放 (MouseWheelZoom)
- 键盘缩放 (KeyboardZoom)

### 样式
- 容器: 全屏铺满
- 控件样式: 使用OpenLayers默认样式

## 3. 交互规格

### 缩放功能
- 鼠标滚轮缩放
- 地图右上角 +/- 按钮缩放
- 双击缩放
- 键盘 +/- 键缩放

### 地图平移
- 鼠标拖拽平移
- 键盘方向键平移

## 4. 技术实现

- **框架**: Vue 3 + TypeScript + Vite
- **地图库**: OpenLayers (ol)
- **天地图**: 使用WMTS协议加载切片
- **投影**: EPSG:3857 (Web Mercator)

## 5. 验收标准

- [ ] 地图正确加载天地图底图
- [ ] 地形晕渲效果可见
- [ ] 文字标注叠加层正确显示
- [ ] 缩放控件正常工作
- [ ] 鼠标滚轮缩放正常
- [ ] 地图可以平移
- [ ] 无JavaScript运行时错误
