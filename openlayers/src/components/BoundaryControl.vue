<script setup lang="ts">
import { ref } from "vue";
import Map from "ol/Map";
import {
  useBoundaryLayer,
  ADMIN_CODES,
  type BoundaryLevel,
} from "../composables/useBoundaryLayer";

const props = defineProps<{
  map: Map;
}>();

const map = props.map;

// 边界图层管理
const { addChinaBoundary, addProvinceBoundary, removeAllBoundaries, removeBoundaryByCode, setBoundaryStyle, isLoading, dispose } =
  useBoundaryLayer({ map });

// 当前激活的边界
const activeBoundaries = ref<string[]>([]);

// 常用省市列表
const provinceList: BoundaryLevel[] = [
  { name: "北京市", code: ADMIN_CODES.beijing, level: "province" },
  { name: "天津市", code: ADMIN_CODES.tianjin, level: "province" },
  { name: "河北省", code: ADMIN_CODES.hebei, level: "province" },
  { name: "山西省", code: ADMIN_CODES.shanxi, level: "province" },
  { name: "内蒙古", code: ADMIN_CODES.neimenggu, level: "province" },
  { name: "辽宁省", code: ADMIN_CODES.liaoning, level: "province" },
  { name: "吉林省", code: ADMIN_CODES.jilin, level: "province" },
  { name: "黑龙江", code: ADMIN_CODES.heilongjiang, level: "province" },
  { name: "上海市", code: ADMIN_CODES.shanghai, level: "province" },
  { name: "江苏省", code: ADMIN_CODES.jiangsu, level: "province" },
  { name: "浙江省", code: ADMIN_CODES.zhejiang, level: "province" },
  { name: "安徽省", code: ADMIN_CODES.anhui, level: "province" },
  { name: "福建省", code: ADMIN_CODES.fujian, level: "province" },
  { name: "江西省", code: ADMIN_CODES.jiangxi, level: "province" },
  { name: "山东省", code: ADMIN_CODES.shandong, level: "province" },
  { name: "河南省", code: ADMIN_CODES.henan, level: "province" },
  { name: "湖北省", code: ADMIN_CODES.hubei, level: "province" },
  { name: "湖南省", code: ADMIN_CODES.hunan, level: "province" },
  { name: "广东省", code: ADMIN_CODES.guangdong, level: "province" },
  { name: "广西", code: ADMIN_CODES.guangxi, level: "province" },
  { name: "海南省", code: ADMIN_CODES.hainan, level: "province" },
  { name: "重庆市", code: ADMIN_CODES.chongqing, level: "province" },
  { name: "四川省", code: ADMIN_CODES.sichuan, level: "province" },
  { name: "贵州省", code: ADMIN_CODES.guizhou, level: "province" },
  { name: "云南省", code: ADMIN_CODES.yunnan, level: "province" },
  { name: "西藏", code: ADMIN_CODES.xizang, level: "province" },
  { name: "陕西省", code: ADMIN_CODES.shaanxi, level: "province" },
  { name: "甘肃省", code: ADMIN_CODES.gansu, level: "province" },
  { name: "青海省", code: ADMIN_CODES.qinghai, level: "province" },
  { name: "宁夏", code: ADMIN_CODES.ningxia, level: "province" },
  { name: "新疆", code: ADMIN_CODES.xinjiang, level: "province" },
  { name: "台湾省", code: ADMIN_CODES.taiwan, level: "province" },
];

// 西南地区省市
const southwestProvinces = [
  { name: "重庆市", code: ADMIN_CODES.chongqing },
  { name: "四川省", code: ADMIN_CODES.sichuan },
  { name: "贵州省", code: ADMIN_CODES.guizhou },
  { name: "云南省", code: ADMIN_CODES.yunnan },
  { name: "西藏", code: ADMIN_CODES.xizang },
];

// 添加中国边界
async function toggleChina() {
  const idx = activeBoundaries.value.indexOf("china");
  if (idx > -1) {
    activeBoundaries.value.splice(idx, 1);
    removeBoundaryByCode("100000");
  } else {
    activeBoundaries.value.push("china");
    await addChinaBoundary();
  }
}

// 切换省市边界
async function toggleProvince(code: string) {
  const idx = activeBoundaries.value.indexOf(code);
  if (idx > -1) {
    activeBoundaries.value.splice(idx, 1);
    removeBoundaryByCode(code);
  } else {
    activeBoundaries.value.push(code);
    await addProvinceBoundary(code);
  }
}

// 添加西南地区 - 替换式添加（先清除旧西南省份再添加新的）
async function addSouthwest() {
  // 从activeBoundaries中移除西南省份（避免重复添加）
  activeBoundaries.value = activeBoundaries.value.filter(
    (code) => !southwestProvinces.some((p) => p.code === code)
  );

  // 添加全部西南省份
  activeBoundaries.value.push(...southwestProvinces.map((p) => p.code));

  // 添加新省份的边界图层
  for (const province of southwestProvinces) {
    await addProvinceBoundary(province.code);
  }
}

// 清除全部 - 真正删除图层
function clearAll() {
  activeBoundaries.value = [];
  removeAllBoundaries();
}

// 样式设置
const strokeColor = ref("#3388ff");
const strokeWidth = ref(1);
const fillOpacity = ref(0.1);

function applyStyle() {
  setBoundaryStyle({
    strokeColor: strokeColor.value,
    strokeWidth: strokeWidth.value,
    fillOpacity: fillOpacity.value,
  });
}

// 监听样式变化
function onStyleChange() {
  applyStyle();
}

// 暴露方法给父组件
defineExpose({
  toggleChina,
  toggleProvince,
  addSouthwest,
  clearAll,
  setBoundaryStyle,
  dispose,
});

// 组件卸载时不自动清除，让父组件控制
// onUnmounted(() => {
//   dispose();
// });
</script>

<template>
  <div class="boundary-control">
    <div class="control-header">
      <span class="title">边界图层</span>
      <span v-if="isLoading" class="loading">加载中...</span>
    </div>

    <!-- 中国边界 -->
    <div class="control-section">
      <button
        class="btn btn-china"
        :class="{ active: activeBoundaries.includes('china') }"
        @click="toggleChina"
      >
        中国轮廓
      </button>
    </div>

    <!-- 快速添加 -->
    <div class="control-section">
      <div class="section-label">快速添加</div>
      <button class="btn btn-quick" @click="addSouthwest">
        西南地区 (5个省市)
      </button>
      <button class="btn btn-clear" @click="clearAll">
        清除全部
      </button>
    </div>

    <!-- 省市列表 -->
    <div class="control-section">
      <div class="section-label">省市边界</div>
      <div class="province-grid">
        <button
          v-for="province in provinceList"
          :key="province.code"
          class="btn btn-province"
          :class="{ active: activeBoundaries.includes(province.code) }"
          @click="toggleProvince(province.code)"
        >
          {{ province.name }}
        </button>
      </div>
    </div>

    <!-- 样式设置 -->
    <div class="control-section">
      <div class="section-label">样式设置</div>
      <div class="style-row">
        <label>描边颜色</label>
        <input
          type="color"
          v-model="strokeColor"
          @change="onStyleChange"
        />
      </div>
      <div class="style-row">
        <label>描边宽度</label>
        <input
          type="range"
          min="1"
          max="5"
          step="0.5"
          v-model="strokeWidth"
          @change="onStyleChange"
        />
        <span class="value">{{ strokeWidth }}px</span>
      </div>
      <div class="style-row">
        <label>填充透明度</label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          v-model="fillOpacity"
          @change="onStyleChange"
        />
        <span class="value">{{ Math.round(fillOpacity * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boundary-control {
  background: white;
  border-radius: 8px;
  padding: 16px;
  width: 280px;
  max-height: 600px;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.loading {
  font-size: 12px;
  color: #666;
}

.control-section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-china {
  width: 100%;
  padding: 10px 16px;
  background: #f0f0f0;
  color: #333;
}

.btn-china.active {
  background: #3388ff;
  color: white;
}

.btn-quick {
  width: 100%;
  padding: 8px 12px;
  background: #e3f2fd;
  color: #1976d2;
  margin-bottom: 8px;
}

.btn-quick:hover {
  background: #bbdefb;
}

.btn-clear {
  width: 100%;
  padding: 8px 12px;
  background: #ffebee;
  color: #c62828;
}

.btn-clear:hover {
  background: #ffcdd2;
}

.province-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.btn-province {
  padding: 6px 4px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
}

.btn-province.active {
  background: #4caf50;
  color: white;
}

.btn-province:hover:not(.active) {
  background: #e0e0e0;
}

.style-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.style-row label {
  font-size: 12px;
  color: #666;
  min-width: 70px;
}

.style-row input[type="color"] {
  width: 32px;
  height: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.style-row input[type="range"] {
  flex: 1;
}

.style-row .value {
  font-size: 11px;
  color: #999;
  min-width: 35px;
  text-align: right;
}
</style>
