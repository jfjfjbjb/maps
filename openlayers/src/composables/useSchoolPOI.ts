import { ref } from "vue";

export interface POI {
  name: string;
  lon: number;
  lat: number;
}

// 高德地图POI类型码 - 小学
const AMAP_SCHOOL_TYPE = "141203";

// 重庆地区默认小学样本数据（API查询失败时使用）
const DEFAULT_SCHOOLS: POI[] = [
  { name: "重庆市人民小学", lon: 106.5412, lat: 29.5591 },
  { name: "重庆市巴蜀小学", lon: 106.5385, lat: 29.5523 },
  { name: "重庆市人和街小学", lon: 106.5356, lat: 29.5578 },
  { name: "重庆市谢家湾小学", lon: 106.4892, lat: 29.5421 },
  { name: "重庆市沙坪坝小学", lon: 106.4578, lat: 29.5689 },
  { name: "重庆市南开小学", lon: 106.4523, lat: 29.5512 },
  { name: "重庆市树人小学", lon: 106.4678, lat: 29.5634 },
  { name: "重庆市渝中区实验小学", lon: 106.5623, lat: 29.5489 },
  { name: "重庆市江北区观音桥小学", lon: 106.5234, lat: 29.5723 },
  { name: "重庆市渝北区空港新城小学", lon: 106.6234, lat: 29.7189 },
  { name: "重庆市北碚区朝阳小学", lon: 106.4378, lat: 29.8056 },
  { name: "重庆市大渡口区育才小学", lon: 106.4823, lat: 29.4934 },
  { name: "重庆市九龙坡区杨家坪小学", lon: 106.5056, lat: 29.5234 },
  { name: "重庆市南岸区珊瑚小学", lon: 106.5678, lat: 29.5234 },
  { name: "重庆市高新区第一实验小学", lon: 106.4512, lat: 29.6123 },
];

// 从环境变量获取高德API Key
const AMAP_KEY = 'c5dbc6be97b745d66860f88834cd58c4';

export function useSchoolPOI() {
  const schools = ref<POI[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 缓存：key = "城市名"，避免重复请求
  const cache = new Map<string, POI[]>();

  /**
   * 使用高德POI API查询学校信息
   * 固定在重庆市范围内搜索，自动分页获取全部数据
   * 查询失败时自动降级使用默认数据
   */
  async function searchSchools(keyword: string, city: string): Promise<POI[]> {
    loading.value = true;
    error.value = null;

    const cacheKey = city || "重庆市";

    // 命中缓存直接返回
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      schools.value = cached;
      loading.value = false;
      return cached;
    }

    try {
      // 如果没有配置API Key，直接使用默认数据
      if (!AMAP_KEY) {
        console.warn("[useSchoolPOI] 未配置 VITE_AMAP_KEY，使用默认数据");
        schools.value = DEFAULT_SCHOOLS;
        cache.set(cacheKey, DEFAULT_SCHOOLS);
        return DEFAULT_SCHOOLS;
      }

      const PAGE_SIZE = 20;
      let allPois: POI[] = [];
      let page = 1;
      let total = Infinity;

      // 分页循环，直到拿完所有数据
      while (allPois.length < total) {
        const url = new URL("https://restapi.amap.com/v3/place/text");
        url.searchParams.set("key", AMAP_KEY);
        url.searchParams.set("keywords", keyword || "小学");
        url.searchParams.set("city", cacheKey);
        url.searchParams.set("citylimit", "true"); // 限制在指定城市内
        url.searchParams.set("offset", String(PAGE_SIZE));
        url.searchParams.set("page", String(page));
        url.searchParams.set("types", AMAP_SCHOOL_TYPE); // 141203 = 小学
        url.searchParams.set("output", "json");

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "1" || !data.pois || data.pois.length === 0) {
          break;
        }

        // 解析高德POI数据
        const pois: POI[] = data.pois.map((poi: { name: string; location: string }) => {
          const [lon, lat] = poi.location.split(",").map(Number);
          return {
            name: poi.name,
            lon,
            lat,
          };
        });

        allPois.push(...pois);
        total = parseInt(data.count, 10) || 0;
        page++;

        // 防止无限循环
        if (page > 100 || pois.length === 0) {
          break;
        }
      }

      console.log(`[useSchoolPOI] 共获取 ${allPois.length} 所小学`);
      schools.value = allPois;
      cache.set(cacheKey, allPois);
      return allPois;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "未知错误";
      console.error(`[useSchoolPOI] 查询失败: ${errMsg}，使用默认数据`);
      error.value = errMsg;
      schools.value = DEFAULT_SCHOOLS;
      return DEFAULT_SCHOOLS;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取默认学校数据（用于调试）
   */
  function getDefaultSchools(): POI[] {
    return DEFAULT_SCHOOLS;
  }

  return {
    schools,
    loading,
    error,
    searchSchools,
    getDefaultSchools,
  };
}
