import { ref, computed, type Ref, type ComputedRef } from "vue";
import type Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";

// ===== 高德地图底图配置 =====

interface BaseMapConfig {
  id: string;
  name: string;
  urls: string[];
  tilePixelRatio?: number;
  zIndex: number;
}

/** 高德矢量瓦片子域名列表（用于负载均衡） */
const VECTOR_SUBDOMAINS = ["webrd01", "webrd02", "webrd03", "webrd04"];
/** 高德卫星瓦片子域名列表 */
const SATELLITE_SUBDOMAINS = ["webst01", "webst02", "webst03", "webst04"];

/** 矢量底图 URL 列表（多子域名供 OL 自动负载均衡） */
const VECTOR_URLS = VECTOR_SUBDOMAINS.map(
  (sub) => `https://${sub}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`,
);

/** 卫星底图 URL 列表 */
const SATELLITE_URLS = SATELLITE_SUBDOMAINS.map(
  (sub) => `https://${sub}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}`,
);

/** 路网标注叠加层 URL 列表（在卫星影像上叠加路网文字） */
const LABEL_URLS = SATELLITE_SUBDOMAINS.map(
  (sub) => `https://${sub}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}`,
);

const BASE_MAP_CONFIGS: BaseMapConfig[] = [
  {
    id: "vector",
    name: "矢量底图",
    urls: VECTOR_URLS,
    tilePixelRatio: 2,
    zIndex: 0,
  },
  {
    id: "satellite",
    name: "卫星影像",
    urls: SATELLITE_URLS,
    zIndex: 0,
  },
  {
    id: "satellite_label",
    name: "路网标注",
    urls: LABEL_URLS,
    zIndex: 1,
  },
];

// ===== 类型导出 =====

export interface BaseMapItem {
  id: string;
  name: string;
  visible: boolean;
  layer: TileLayer<XYZ>;
}

export interface UseBaseMapOptions {
  map: Map;
}

export interface UseBaseMapResult {
  /** 所有底图项 */
  baseMaps: Ref<BaseMapItem[]>;
  /** 当前可见的底图 */
  activeBaseMaps: ComputedRef<BaseMapItem[]>;
  /** 切换图层显示/隐藏 */
  toggle: (id: string) => void;
  /** 清理函数 */
  dispose: () => void;
}

/**
 * 高德底图管理 composable
 *
 * 每个图层独立开关（checkbox 模式），勾选即显示。
 * zIndex: 底图=0，标注叠加层=1，边界图层=5
 *
 * @example
 * ```ts
 * const { baseMaps, toggle, dispose } = useBaseMap({ map })
 * toggle('satellite')        // 切换卫星图显示
 * toggle('satellite_label')  // 切换路网标注显示
 * ```
 */
export function useBaseMap({ map }: UseBaseMapOptions): UseBaseMapResult {
  const items: BaseMapItem[] = BASE_MAP_CONFIGS.map((cfg) => ({
    id: cfg.id,
    name: cfg.name,
    visible: cfg.id === "vector",
    layer: new TileLayer({
      source: new XYZ({
        urls: cfg.urls,
        tilePixelRatio: cfg.tilePixelRatio ?? 1,
      }),
      zIndex: cfg.zIndex,
      visible: cfg.id === "vector",
    }),
  }));

  // 将所有图层添加到地图（边界图层 zIndex:5 会渲染在底图之上）
  items.forEach((item) => map.addLayer(item.layer));

  const baseMaps = ref(items);

  const activeBaseMaps = computed(() =>
    items.filter((item) => item.visible),
  );

  /** 切换图层显示/隐藏 */
  function toggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newVisible = !item.visible;
    item.visible = newVisible;
    item.layer.setVisible(newVisible);
  }

  /** 清理：从地图移除所有底图图层 */
  function dispose() {
    items.forEach((item) => {
      map.removeLayer(item.layer);
    });
  }

  return {
    baseMaps: baseMaps as Ref<BaseMapItem[]>,
    activeBaseMaps,
    toggle,
    dispose,
  };
}
