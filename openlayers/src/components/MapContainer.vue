<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { XYZ } from "ol/source";
import { defaults as defaultControls } from "ol/control/defaults";
import "ol/ol.css";
import { useControls } from "../composables/useControls";
import { useRouteSimulation } from "../composables/useRouteSimulation";
import BoundaryControl from "../components/BoundaryControl.vue";
import DrawToolbar from "../components/DrawToolbar.vue";
// import { useSchoolAnnotation } from "../composables/useSchoolAnnotation";
// import { useMapSchoolQuery } from "../composables/useMapSchoolQuery";

// 天地图Token
// const TIANDITU_TOKEN = "93bcff03e8b49fe2da953aac3305cac3";

// 中国区域中心点 - 重庆
const center = fromLonLat([106.551294, 29.533155]);

// 天地图矢量底图
const tiandituBaseLayer = new TileLayer({
  source: new XYZ({
    // url: `http://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TOKEN}`,
    url: `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`,
    tilePixelRatio: 2,
  }),
});

// 天地图标注图层
// const tiandituLabelLayer = new TileLayer({
//   source: new XYZ({
//     url: `http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TOKEN}`,
//     tilePixelRatio: 2,
//   }),
// });

// 地图实例
let map: Map | null = null;
let controlsDispose: (() => void) | null = null;
let routeDispose: (() => void) | null = null;
let drawRouteFn: ((from: "flowerGarden" | "grandTheater") => void) | null = null;
let clearRouteFn: (() => void) | null = null;
// let schoolDispose: (() => void) | null = null;
// let schoolQueryDispose: (() => void) | null = null;

// 图层信息加载状态，请求完成后置为 false
const loading = ref(true);
// 瓦片加载完毕后是否已初始化（防止重复初始化）
let hasLoaded = false;

// 边界图层控制按钮状态
const showBoundaryControl = ref(false);
// 路径模拟状态
const routeVisible = ref(false);

function toggleBoundaryControl() {
  showBoundaryControl.value = !showBoundaryControl.value;
}

function handleRouteToggle() {
  if (routeVisible.value) {
    clearRouteFn?.();
    routeVisible.value = false;
  } else {
    drawRouteFn?.("flowerGarden");
    routeVisible.value = true;
  }
}

onMounted(() => {
  map = new Map({
    target: "map-container",
    controls: defaultControls({ zoom: false, rotate: false }),
    // layers: [tiandituBaseLayer, tiandituLabelLayer],
    layers: [tiandituBaseLayer],
    view: new View({
      center: center,
      zoom: 10,
      minZoom: 4,
      maxZoom: 18,
    }),
  });

  // 初始化地图（瓦片加载完毕后执行一次）
  map.on("rendercomplete", function () {
    if (hasLoaded) return;
    hasLoaded = true;

    loading.value = false;

    // 初始化控件（瓦片加载完毕后执行一次）
    const { dispose: controlsFn } = useControls({ map: map as Map });
    controlsDispose = controlsFn;

    // 初始化路径模拟
    const { dispose: routeFn, drawRoute, clearRoute } = useRouteSimulation({ map: map as Map });
    routeDispose = routeFn;
    drawRouteFn = drawRoute;
    clearRouteFn = clearRoute;

    // 初始化学校标注
    // const { addSchool, clearAll, dispose } = useSchoolAnnotation({ map: map });
    // schoolDispose = dispose;

    // 初始化视野查询学校
    // const { dispose: queryDispose } = useMapSchoolQuery({
    //   map,
    //   minZoom: 12,
    //   debounceMs: 800,
    //   onClear: () => clearAll(),
    //   onAddSchool: (poi: { lon: number; lat: number; name: string }) => {
    //     addSchool(poi.lon, poi.lat, poi.name);
    //   },
    // });
    // schoolQueryDispose = queryDispose;
  });
});

onUnmounted(() => {
  // schoolQueryDispose?.();
  // schoolDispose?.();
  routeDispose?.();
  controlsDispose?.();
  if (map) {
    map.dispose();
    map = null;
  }
});
</script>

<template>
  <div class="map-wrapper">
    <div id="map-container" class="map-container"></div>
    <!-- 加载遮罩，图层信息请求完成前显示 -->
    <div v-if="loading" class="map-loading">
      <div class="map-loading-spinner"></div>
      <span>图层加载中...</span>
    </div>
    <!-- 绘图工具栏 -->
    <DrawToolbar v-if="map && !loading" :map="map" />
    <!-- 工具按钮组 -->
    <template v-if="!loading">
      <div class="toolbar-group">
        <div class="toolbar-btn" @click="toggleBoundaryControl">
          <span>{{ showBoundaryControl ? "关闭" : "边界图层" }}</span>
        </div>
        <div class="toolbar-btn" @click="handleRouteToggle">
          <span>{{ routeVisible ? "清除路径" : "模拟路径" }}</span>
        </div>
      </div>
      <div v-show="showBoundaryControl" class="boundary-panel">
        <BoundaryControl :map="map" v-if="map" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 加载遮罩 */
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.75);
  z-index: 2000;
  font-size: 14px;
  color: #357abd;
}

.map-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(74, 144, 226, 0.25);
  border-top-color: #4a90e2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 工具按钮组 - 统一位置控制 */
.toolbar-group {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

/* 通用工具按钮样式 */
.toolbar-btn {
  background: #fff;
  color: #333;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  user-select: none;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f8f9fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.toolbar-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.boundary-panel {
  position: fixed;
  top: 68px;
  right: 20px;
  z-index: 1000;
}

/* 小屏幕适配：按钮组移到左上角 */
@media (max-width: 768px) {
  .toolbar-group {
    /* top: 80px;
    right: auto;
    left: 10px; */
  }

  .toolbar-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .boundary-panel {
    top: 60px;
    /* right: auto;
    left: 12px; */
  }

  .boundary-control {
    max-height: 500px;
  }

  /* 绘图工具栏在小屏幕上往上一点 */
  .draw-toolbar {
    top: 8px;
  }
}
</style>

<style>
/* 全局样式 - 弹窗 */
.school-popup {
  position: absolute;
  z-index: 2000;
}

.popup-content {
  background: white;
  border-radius: 6px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  min-width: 120px;
  max-width: 250px;
}

.popup-content::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
}

.popup-text {
  font-size: 14px;
  color: #333;
  text-align: center;
}

/* 鼠标位置控件 - 右下角经纬度显示 */
.mouse-position-control {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  pointer-events: none;
  letter-spacing: 0.5px;
}
</style>
