<script setup lang="ts">
import { useDrawTool, type DrawType } from "../composables/useDrawTool";
import locationIcon from "../assets/location.svg?url";
import type { Map } from "ol";

const props = defineProps<{
  map: Map;
}>();

const { activeType, features, startDraw, clearAll } = useDrawTool({ map: props.map });

const tools: { type: DrawType; icon: string; isImg?: boolean }[] = [
  { type: "Point", icon: "●" },
  { type: "Location", icon: locationIcon, isImg: true },
  { type: "LineString", icon: "╱" },
  { type: "Circle", icon: "◎" },
  { type: "Polygon", icon: "⬡" },
];

function selectTool(type: DrawType) {
  if (activeType.value === type) {
    startDraw("None");
  } else {
    startDraw(type);
  }
}
</script>

<template>
  <div class="draw-toolbar">
    <button
      v-for="tool in tools"
      :key="tool.type"
      class="tool-btn"
      :class="{ active: activeType === tool.type }"
      @click="selectTool(tool.type)"
    >
      <img v-if="tool.isImg" :src="tool.icon" class="tool-icon" />
      <span v-else>{{ tool.icon }}</span>
    </button>
    <div class="divider"></div>
    <button class="tool-btn" :class="{ active: activeType === 'None' }" @click="startDraw('None')">
      ✕
    </button>
    <button v-if="features.length > 0" class="tool-btn clear-btn" @click="clearAll">
      删
    </button>
    <span v-if="features.length > 0" class="count">{{ features.length }}要素</span>
  </div>
  <div class="feature-list" v-if="features.length > 0">
    <div class="feature-item" v-for="(info, idx) in features" :key="idx">
      <span class="feature-index">{{ idx + 1 }}</span>
      <span class="feature-type">{{ info.type === 'Point' ? '点' : info.type === 'Location' ? '定位' : info.type === 'LineString' ? '线' : info.type === 'Circle' ? '圆' : '面' }}</span>
      <span class="feature-info">{{ info.coords }}</span>
    </div>
  </div>
</template>

<style scoped>
.draw-toolbar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  padding: 6px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: rgba(74, 144, 226, 0.1);
}

.tool-btn.active {
  background: #4a90e2;
  color: white;
}

.tool-icon {
  width: 18px;
  height: 18px;
}

.divider {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 4px;
}

.clear-btn {
  color: #fff;
  background: #e74c3c;
  font-size: 12px;
  font-weight: 500;
}

.clear-btn:hover {
  background: #c0392b;
}

.count {
  font-size: 12px;
  color: #666;
  padding: 0 4px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .draw-toolbar {
    top: 6px;
    padding: 4px 8px;
    gap: 2px;
    left: 24px;
    transform: translateX(0)
  }

  .tool-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .tool-icon {
    width: 16px;
    height: 16px;
  }

  .feature-list {
    bottom: 40px;
    left: 8px;
    right: 8px;
    max-width: none;
    font-size: 10px;
  }
}

.feature-list {
  position: fixed;
  bottom: 50px;
  left: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-width: 420px;
  max-height: 160px;
  overflow-y: auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 11px;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-index {
  background: #4a90e2;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  flex-shrink: 0;
}

.feature-type {
  background: #e8f4fc;
  color: #4a90e2;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  flex-shrink: 0;
}

.feature-info {
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
