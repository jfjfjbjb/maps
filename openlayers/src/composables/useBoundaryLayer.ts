import { onMounted, onUnmounted, ref } from "vue";
import Map from "ol/Map";
import { unByKey } from "ol/Observable";
import WebGLVectorLayer from "ol/layer/WebGLVector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { getCenter } from "ol/extent";

// 阿里DataV GeoJSON 边界数据 API
// 数据来源: https://datav.aliyun.com/areas_v3/
const DATA_V_BOUNDARY_URL = "https://geo.datav.aliyun.com/areas_v3/bound";

// 省市边界缓存
const boundaryCache = new globalThis.Map<string, GeoJSON.FeatureCollection>();

export interface BoundaryLevel {
  name: string;
  code: string;
  level: "country" | "province" | "city";
}

// 常用行政区划代码
export const ADMIN_CODES = {
  // 省份
  beijing: "110000",
  tianjin: "120000",
  hebei: "130000",
  shanxi: "140000",
  neimenggu: "150000",
  liaoning: "210000",
  jilin: "220000",
  heilongjiang: "230000",
  shanghai: "310000",
  jiangsu: "320000",
  zhejiang: "330000",
  anhui: "340000",
  fujian: "350000",
  jiangxi: "360000",
  shandong: "370000",
  henan: "410000",
  hubei: "420000",
  hunan: "430000",
  guangdong: "440000",
  guangxi: "450000",
  hainan: "460000",
  chongqing: "500000",
  sichuan: "510000",
  guizhou: "520000",
  yunnan: "530000",
  xizang: "540000",
  shaanxi: "610000",
  gansu: "620000",
  qinghai: "630000",
  ningxia: "640000",
  xinjiang: "650000",
  taiwan: "710000",
  xianggang: "810000",
  aomen: "820000",

  // 主要城市
  chengdu: "510100",
  chongqing_main: "500100",
  beijing_main: "110100",
  shanghai_main: "310100",
};

// 中国边界code
const CHINA_CODE = "100000";

export interface UseBoundaryLayerOptions {
  map: Map;
}

export interface BoundaryLayerResult {
  /**
   * 添加中国轮廓
   */
  addChinaBoundary: () => Promise<void>;

  /**
   * 添加省市边界
   * @param code 行政区划代码 (如: 510000 四川省, 510100 成都市)
   */
  addProvinceBoundary: (code: string) => Promise<void>;

  /**
   * 添加多个省市边界
   * @param codes 行政区划代码数组
   */
  addMultipleBoundaries: (codes: string[]) => Promise<void>;

  /**
   * 移除所有边界图层
   */
  removeAllBoundaries: () => void;

  /**
   * 移除指定行政区划代码的边界图层
   * @param code 行政区划代码 (如: 510000 四川省, 510100 成都市)
   */
  removeBoundaryByCode: (code: string) => void;

  /**
   * 设置边界样式
   */
  setBoundaryStyle: (style: {
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    fillOpacity?: number;
  }) => void;

  /**
   * 加载状态
   */
  isLoading: ReturnType<typeof ref<boolean>>;

  /**
   * 清理函数
   */
  dispose: () => void;
}

export function useBoundaryLayer({
  map,
}: UseBoundaryLayerOptions): BoundaryLayerResult {
  const isLoading = ref(false);

  // 样式配置
  let currentStyle = {
    strokeColor: "#3388ff",
    strokeWidth: 1,
    fillColor: "#3388ff",
    fillOpacity: 0.1,
  };

  // 存储所有边界图层
  const boundaryLayers: WebGLVectorLayer[] = [];

  // 存储所有边界数据源
  const boundarySources: VectorSource[] = [];

  // 当前 hover 的 feature
  let hoveredFeature: Feature | null = null;

  // pointermove 事件 key，用于清理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pointerMoveKey: any = null;

  /**
   * 创建 WebGL 扁平样式（用于 GPU 加速渲染）
   */
  function createStyle() {
    const style = currentStyle;
    return [
      {
        filter: ["==", ["get", "hovered"], 1],
        style: {
          "stroke-color": style.strokeColor,
          "stroke-width": Number(style.strokeWidth),
          "fill-color": hexToRgba(style.fillColor, style.fillOpacity + 0.2),
        },
      },
      {
        else: true,
        style: {
          "stroke-color": style.strokeColor,
          "stroke-width": Number(style.strokeWidth),
          "fill-color": hexToRgba(style.fillColor, style.fillOpacity),
        },
      },
    ];
  }

  /**
   * 初始化 hover 事件监听
   */
  function initHoverEvents() {
    pointerMoveKey = map.on("pointermove", (evt) => {
      if (evt.dragging) return;

      const features = map.getFeaturesAtPixel(evt.pixel, {
        layerFilter: (l) => l.get("name") === "china",
      });

      const newHoveredFeature =
        features && features.length > 0 ? (features[0] as Feature) : null;

      if (!newHoveredFeature) {
        hoveredFeature && hoveredFeature.setProperties({ hovered: 0 });
        hoveredFeature = null;
        return;
      }

      if (newHoveredFeature !== hoveredFeature) {
        hoveredFeature && hoveredFeature.setProperties({ hovered: 0 });
        newHoveredFeature.setProperties({ hovered: 1 });
        hoveredFeature = newHoveredFeature;
        // // 触发图层重绘以应用新的样式
        // layer.changed();
        // // 更新鼠标样式
        // map.getTargetElement().style.cursor = hoveredFeature ? "pointer" : "";
      }
    });
  }

  /**
   * 移除 hover 事件监听
   */
  function removeHoverEvents() {
    if (pointerMoveKey) {
      unByKey(pointerMoveKey);
      pointerMoveKey = null;
    }
    hoveredFeature = null;
  }

  /**
   * 获取边界数据
   */
  async function fetchBoundaryData(
    code: string,
  ): Promise<GeoJSON.FeatureCollection | null> {
    // 先检查缓存
    if (boundaryCache.has(code)) {
      return boundaryCache.get(code)!;
    }

    try {
      isLoading.value = true;

      // 阿里DataV GeoJSON边界API
      const url = `${DATA_V_BOUNDARY_URL}/${code}_full.json`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Failed to fetch boundary for code ${code}:`,
          response.statusText,
        );
        return null;
      }

      const data = await response.json();

      if (data.type === "FeatureCollection") {
        boundaryCache.set(code, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching boundary for code ${code}:`, error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 移除单个边界图层
   */
  function removeBoundaryByCode(code: string): void {
    // 找到对应code的图层索引
    const index = boundaryLayers.findIndex((layer) => {
      const features = layer.getSource()?.getFeatures();
      if (!features || features.length === 0) return false;
      // 通过feature属性匹配code（如果GeoJSON有属性）
      return features.some((f: Feature) => {
        const props = f.getProperties();
        return props?.parent?.adcode == code || props?.code == code;
      });
    });

    if (index > -1) {
      const layer = boundaryLayers[index];
      map.removeLayer(layer);
      boundaryLayers.splice(index, 1);
      const source = boundarySources[index];
      if (source) {
        source.clear();
        const srcIdx = boundarySources.indexOf(source);
        if (srcIdx > -1) boundarySources.splice(srcIdx, 1);
      }
    }
  }

  /**
   * 动画定位到边界区域
   */
  function animateToExtent(source: VectorSource): void {
    const features = source.getFeatures();
    if (features.length === 0) return;

    // 计算所有要素的边界范围
    const extent = features[0].getGeometry()?.getExtent() || [];
    for (let i = 1; i < features.length; i++) {
      const geom = features[i].getGeometry();
      if (geom) {
        const fe = geom.getExtent();
        extent[0] = Math.min(extent[0], fe[0]);
        extent[1] = Math.min(extent[1], fe[1]);
        extent[2] = Math.max(extent[2], fe[2]);
        extent[3] = Math.max(extent[3], fe[3]);
      }
    }

    if (extent.length === 4 && extent.every((v) => isFinite(v))) {
      const view = map.getView();
      const mapSize = map.getSize();
      if (!mapSize) return;

      // 计算水平和垂直方向各自需要多少单位来填满视口
      const resX = (extent[2] - extent[0]) / mapSize[0];
      const resY = (extent[3] - extent[1]) / mapSize[1];
      // 取较大的 resolution，确保整个边界在视口内可见
      const resolution = Math.max(resX, resY) * 1.05;

      // 根据 resolution 计算 zoom，并限制在合理范围
      let zoom = view.getZoomForResolution(resolution) ?? 10;
      zoom = Math.max(3, Math.min(zoom, 18));

      const center = getCenter(extent);

      map.getView().animate({
        center,
        zoom,
        duration: 800,
      });
    }
  }

  /**
   * 添加边界图层
   */
  async function addBoundaryLayer(code: string, _name?: string): Promise<void> {
    const geoData = await fetchBoundaryData(code);

    if (!geoData || !geoData.features || geoData.features.length === 0) {
      console.warn(`No boundary data found for code: ${code}`);
      return;
    }

    // 检查是否已存在相同的code（防止重复添加）
    const exists = boundaryLayers.some((layer) => {
      const features = layer.getSource()?.getFeatures();
      if (!features || features.length === 0) return false;
      return features.some((f: Feature) => {
        const props = f.getProperties();
        return props?.parent?.adcode == code || props?.code == code;
      });
    });
    if (exists) return;

    // 创建数据源
    const source = new VectorSource({
      features: new GeoJSON().readFeatures(geoData, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }),
    });
    boundarySources.push(source);

    // 创建图层（使用 WebGLVectorLayer 实现 GPU 加速）
    const layer = new WebGLVectorLayer({
      source,
      style: createStyle(),
      zIndex: 5,
    });
    layer.set("name", _name || code);
    boundaryLayers.push(layer);
    map.addLayer(layer);

    // 动画定位到边界区域
    animateToExtent(source);
  }

  /**
   * 添加中国轮廓
   */
  async function addChinaBoundary(): Promise<void> {
    await addBoundaryLayer(CHINA_CODE, "china");
  }

  /**
   * 添加省市边界
   */
  async function addProvinceBoundary(code: string): Promise<void> {
    await addBoundaryLayer(code);
  }

  /**
   * 添加多个省市边界
   */
  async function addMultipleBoundaries(codes: string[]): Promise<void> {
    await Promise.all(codes.map((code) => addBoundaryLayer(code)));
  }

  /**
   * 移除所有边界图层
   */
  function removeAllBoundaries(): void {
    boundaryLayers.forEach((layer) => {
      map.removeLayer(layer);
    });
    boundaryLayers.length = 0;
    boundarySources.length = 0;
  }

  /**
   * 设置边界样式
   */
  function setBoundaryStyle(style: {
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    fillOpacity?: number;
  }): void {
    currentStyle = { ...currentStyle, ...style };

    // 更新所有图层的样式
    boundaryLayers.forEach((layer) => {
      layer.setStyle(createStyle());
    });
  }

  /**
   * 清理函数
   */
  function dispose(): void {
    removeAllBoundaries();
    boundaryCache.clear();
  }

  /**
   * 初始化 hover 事件监听
   */
  onMounted(() => {
    initHoverEvents();
  });
  /**
   * 移除 hover 事件监听
   */
  onUnmounted(() => {
    removeHoverEvents();
  });

  return {
    addChinaBoundary,
    addProvinceBoundary,
    addMultipleBoundaries,
    removeAllBoundaries,
    removeBoundaryByCode,
    setBoundaryStyle,
    isLoading,
    dispose,
  };
}

/**
 * 将hex颜色转换为rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
