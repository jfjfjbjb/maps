<script setup>
import { onMounted, ref } from 'vue'
import * as Cesium from 'cesium'

const container = ref(null)

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
  })

  // 使用高德底图
  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://webst02.is.autonavi.com/app/maptile?style=6&x={x}&y={y}&z={z}',
      credit: '© 高德地图'
    })
  )

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(106.55, 29.57, 10000)
  })
})
</script>

<template>
  <div ref="container" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
