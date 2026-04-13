<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { XYZ } from "ol/source";
import "ol/ol.css";
import { useControls } from "../composables/useControls";
import BoundaryControl from "../components/BoundaryControl.vue";
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
// let schoolDispose: (() => void) | null = null;
// let schoolQueryDispose: (() => void) | null = null;

// 图层信息加载状态，请求完成后置为 false
const loading = ref(true);
// 瓦片加载完毕后是否已初始化（防止重复初始化）
let hasLoaded = false;

// 边界图层控制按钮状态
const showBoundaryControl = ref(false);

function toggleBoundaryControl() {
  showBoundaryControl.value = !showBoundaryControl.value;
}

onMounted(() => {
  map = new Map({
    target: "map-container",
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
    <!-- 边界图层控制按钮 -->
    <template v-if="!loading">
      <div class="boundary-toggle" @click="toggleBoundaryControl">
        <span>{{ showBoundaryControl ? "关闭" : "边界图层" }}</span>
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

/* 边界图层控制按钮 */
.boundary-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(51, 136, 255, 0.35);
  user-select: none;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.25s ease;
}

.boundary-toggle:hover {
  background: linear-gradient(135deg, #5a9fe8 0%, #3d87c8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(51, 136, 255, 0.45);
}

.boundary-toggle:active {
  transform: translateY(0);
}

.boundary-panel {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 1000;
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
</style>
