<script setup>
import { onMounted, ref, reactive } from "vue";
import * as Cesium from "cesium";
import useEntity from "./composables/useEntity";

const container = ref(null);
const showPanel = ref(false);
const toggles = reactive({
  rectangle: false,
  point: false,
  label: false,
  box: false,
  circle: false,
  polyline: false,
  sphere: false,
  corridor: false,
  billboard: false,
  model: false,
});

let entities = {};

const handleToggleChange = (key) => {
  console.log(key, toggles[key]);
  entities[key] && (entities[key].show = toggles[key]);
};

const clearAll = () => {
  Object.keys(toggles).forEach(key => {
    toggles[key] = false;
    entities[key] && (entities[key].show = false);
  });
};



onMounted(() => {
  const viewer = new Cesium.Viewer(container.value, {
    animation: false,
    timeline: false,
    fullscreenButton: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    baseLayerPicker: false,
    geocoder: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });

  // 使用高德底图+标注
  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: "https://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
      credit: "© 高德地图",
    }),
  );

  // 飞到重庆
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(106.55, 28.5, 100000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45.0),
    },
  });

  // viewer.scene.globe.enableLighting = true

  // 实体
  entities = useEntity({ viewer });
});
</script>

<template>
  <div ref="container" class="cesium-container"></div>

  <!-- 控制面板按钮 -->
  <button class="toggle-btn" @click="showPanel = !showPanel">
    {{ showPanel ? '关闭' : '实体控制' }}
  </button>

  <!-- 实体控制面板 -->
  <div v-if="showPanel" class="control-panel">
    <div class="panel-header">
      <h3>实体显示控制</h3>
      <button class="clear-btn" @click="clearAll">清空</button>
    </div>
    <label v-for="(_, key) in toggles" :key="key">
      <input type="checkbox" v-model="toggles[key]" @change="handleToggleChange(key)" />
      {{ key }}
    </label>
  </div>
</template>

<style scoped>
.cesium-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.85);
}

.control-panel {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 150px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.control-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: normal;
}

.clear-btn {
  padding: 2px 10px;
  font-size: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.5);
}

.control-panel label {
  display: block;
  margin: 8px 0;
  font-size: 13px;
  cursor: pointer;
}

.control-panel input {
  margin-right: 8px;
}
</style>
