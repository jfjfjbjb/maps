import { ref } from "vue";
import { useSchoolPOI, type POI } from "./useSchoolPOI";
import Map from "ol/Map";
import { toLonLat, fromLonLat } from "ol/proj";

// 高德 Web API Key（与 useSchoolPOI 保持一致）
const AMAP_KEY = "c5dbc6be97b745d66860f88834cd58c4";

/**
 * 根据中心点坐标获取行政区名称（用于 POI 查询 city 参数）
 */
async function getDistrictByCenter(
  centerLon: number,
  centerLat: number
): Promise<string> {
  try {
    const url = new URL("https://restapi.amap.com/v3/geocode/regeo");
    url.searchParams.set("key", AMAP_KEY);
    url.searchParams.set("location", `${centerLon},${centerLat}`);
    url.searchParams.set("extensions", "base");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "1" && data.regeocode?.addressComponent) {
      const ac = data.regeocode.addressComponent;
      // 优先取 district，若为空则降级取 city，再降级取 province
      const district = ac.district || ac.city || ac.province || "";
      if (district) {
        return district;
      }
    }
  } catch (err) {
    console.warn("[useMapSchoolQuery] 逆向地理编码失败:", err);
  }
  // 失败时默认返回重庆市
  return "重庆市";
}

export interface UseMapSchoolQueryOptions {
  map: Map;
  /** 触发查询的最小缩放级别，默认12 */
  minZoom?: number;
  /** 防抖延迟(ms)，默认800 */
  debounceMs?: number;
  /** 清除学校标注的回调 */
  onClear?: () => void;
  /** 添加学校标注的回调 */
  onAddSchool?: (poi: POI) => void;
}

export function useMapSchoolQuery({
  map,
  minZoom = 12,
  debounceMs = 800,
  onClear,
  onAddSchool,
}: UseMapSchoolQueryOptions) {
  const { searchSchools } = useSchoolPOI();

  const isLoading = ref(false);
  let lastQueryBounds: [number, number, number, number] | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentZoom = map.getView().getZoom() ?? 0;

  /** 查询指定范围内的学校 */
  async function queryInView() {
    const view = map.getView();
    const zoom = view.getZoom() ?? 0;

    // 缩放级别不够，不查询
    if (zoom < minZoom) {
      clearSchools();
      return;
    }

    // 获取当前视野范围
    const extent = view.calculateExtent(map.getSize());
    const [minX, minY, maxX, maxY] = extent;

    // 避免重复查询相同范围
    if (
      lastQueryBounds &&
      lastQueryBounds[0] === minX &&
      lastQueryBounds[1] === minY &&
      lastQueryBounds[2] === maxX &&
      lastQueryBounds[3] === maxY
    ) {
      return;
    }

    // 更新上次查询范围
    lastQueryBounds = [minX, minY, maxX, maxY];

    isLoading.value = true;

    try {
      // 计算视野中心点（Web Mercator），再转为经纬度
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const [centerLon, centerLat] = toLonLat([centerX, centerY]);

      // 根据视野中心点获取所在行政区
      const city = await getDistrictByCenter(centerLon, centerLat);
      console.log("city:", city);
      const schools = await searchSchools("小学", city);

      // 过滤在视野范围内的学校（POI lon/lat 是经纬度，需要转 Web Mercator 再比较）
      const inViewSchools = schools.filter((poi) => {
        const [poiX, poiY] = fromLonLat([poi.lon, poi.lat]);
        return poiX >= minX && poiX <= maxX && poiY >= minY && poiY <= maxY;
      });

      // 清除旧数据
      onClear?.();

      // 添加新数据
      inViewSchools.forEach((poi) => {
        onAddSchool?.(poi);
      });
    } catch (err) {
      console.error("[useMapSchoolQuery] 查询失败:", err);
    } finally {
      isLoading.value = false;
    }
  }

  /** 防抖查询 */
  function debouncedQuery() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      queryInView();
      debounceTimer = null;
    }, debounceMs);
  }

  /** 清空所有学校标注 */
  function clearSchools() {
    onClear?.();
  }

  // 监听地图视野变化
  map.on("moveend", () => {
    const view = map.getView();
    const zoom = view.getZoom() ?? 0;

    // 缩小到阈值以下，清空
    if (zoom < minZoom && currentZoom >= minZoom) {
      clearSchools();
    }

    currentZoom = zoom;

    // 放大到阈值以上，查询
    if (zoom >= minZoom) {
      debouncedQuery();
    }
  });

  /** 主动触发一次查询 */
  function triggerQuery() {
    queryInView();
  }

  /** 销毁 */
  function dispose() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  return {
    isLoading,
    triggerQuery,
    clearSchools,
    dispose,
  };
}
