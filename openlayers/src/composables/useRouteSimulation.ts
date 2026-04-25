import { ref } from "vue";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill, Icon } from "ol/style";
import { LineString, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import locationIcon from "../assets/location.svg?url";
import carIcon from "../assets/car.svg?url";

// === 重庆轨道交通6号线：花卉园 → 大剧院（共6站） ===
const LINE6_STATIONS = [
  { name: "花卉园", coord: fromLonLat([106.5089306, 29.5859611]) as [number, number] },
  { name: "红旗河沟", coord: fromLonLat([106.5224111, 29.5881500]) as [number, number] },
  { name: "黄泥塝", coord: fromLonLat([106.5342694, 29.5912806]) as [number, number] },
  { name: "红土地", coord: fromLonLat([106.54728611, 29.58681694]) as [number, number] },
  { name: "五里店", coord: fromLonLat([106.5620389, 29.5878500]) as [number, number] },
  { name: "大剧院", coord: fromLonLat([106.573269, 29.572432]) as [number, number] },
] as const;

const DEFAULT_SPEED = 500; // 像素/秒

/** 计算两点间的方向角（弧度），适用于图标朝上的情况 */
function getBearing(p1: [number, number], p2: [number, number]): number {
  return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
}

/** 计算路径总长度 */
function getTotalLength(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

export interface UseRouteSimulationOptions {
  map: Map;
  speed?: number;
}

export function useRouteSimulation({
  map,
  speed = DEFAULT_SPEED,
}: UseRouteSimulationOptions) {
  const routeVisible = ref(false);
  const currentRoute = ref<"flowerGarden" | "grandTheater" | null>(null);
  const isAnimating = ref(false);

  // 路径图层
  const routeLayer = new VectorLayer({
    source: new VectorSource(),
    style: (feature) => {
      const geomType = feature.getGeometry()?.getType();
      const isStart = feature.get("isStart");
      const isEnd = feature.get("isEnd");

      if (geomType === "Point") {
        return new Style({
          image: new Icon({
            src: locationIcon,
            scale: isStart || isEnd ? 0.15 : 0.1,
            anchor: [0.5, 1],
          }),
        });
      }

      return new Style({
        stroke: new Stroke({
          color: "#3498db",
          width: 4,
          lineCap: "round",
          lineJoin: "round",
        }),
        fill: new Fill({
          color: "rgba(52, 152, 219, 0.3)",
        }),
      });
    },
  });

  // 小车图层（独立以控制 zIndex）
  const carSource = new VectorSource();
  const carLayer = new VectorLayer({ source: carSource, zIndex: 20 });
  const carFeature = new Feature({ geometry: new Point([0, 0]) });
  carSource.addFeature(carFeature);

  map.addLayer(routeLayer);
  map.addLayer(carLayer);

  let animationId: number | null = null;

  function startAnimation(coords: [number, number][]) {
    stopAnimation();

    const totalLength = getTotalLength(coords);
    const duration = (totalLength / speed) * 1000; // ms

    // 各段长度
    const segLengths: number[] = [];
    for (let i = 1; i < coords.length; i++) {
      const dx = coords[i][0] - coords[i - 1][0];
      const dy = coords[i][1] - coords[i - 1][1];
      segLengths.push(Math.sqrt(dx * dx + dy * dy));
    }

    isAnimating.value = true;
    let startTime: number | null = null;

    function animate(time: number) {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const targetDist = progress * totalLength;

      // 找到当前所在的线段
      let accumulated = 0;
      let segIndex = 0;
      for (let i = 0; i < segLengths.length; i++) {
        if (targetDist <= accumulated + segLengths[i]) {
          segIndex = i;
          break;
        }
        accumulated += segLengths[i];
      }

      if (segIndex < coords.length - 1) {
        const segProgress =
          (targetDist - accumulated) / segLengths[segIndex];
        const x =
          coords[segIndex][0] +
          (coords[segIndex + 1][0] - coords[segIndex][0]) * segProgress;
        const y =
          coords[segIndex][1] +
          (coords[segIndex + 1][1] - coords[segIndex][1]) * segProgress;

        const angle = getBearing(coords[segIndex], coords[segIndex + 1]);

        carFeature.setGeometry(new Point([x, y]));
        carFeature.setStyle(
          new Style({
            image: new Icon({
              src: carIcon,
              scale: 0.8,
              rotation: angle,
              anchor: [0.5, 0.5],
            }),
          })
        );
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          isAnimating.value = false;
        }, 500);
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    isAnimating.value = false;
  }

  function drawRoute(from: "flowerGarden" | "grandTheater") {
    clearRoute();

    // 按运行方向取站点坐标
    const coords = (
      from === "flowerGarden"
        ? LINE6_STATIONS.map((s) => s.coord)
        : [...LINE6_STATIONS].reverse().map((s) => s.coord)
    );

    // 添加站点标记
    const stationFeatures = LINE6_STATIONS.map((station, i) => {
      const f = new Feature({ geometry: new Point(station.coord) });
      if (i === 0) f.set("isStart", true);
      else if (i === LINE6_STATIONS.length - 1) f.set("isEnd", true);
      else f.set("isStation", true);
      return f;
    });

    // 路径线
    const routeFeature = new Feature({ geometry: new LineString(coords) });

    routeLayer.getSource()?.addFeatures([...stationFeatures, routeFeature]);

    routeVisible.value = true;
    currentRoute.value = from;

    startAnimation(coords);
  }

  function clearRoute() {
    stopAnimation();
    routeLayer.getSource()?.clear();
    carFeature.setGeometry(new Point([0, 0]));
    carFeature.setStyle(undefined);
    routeVisible.value = false;
    currentRoute.value = null;
  }

  function dispose() {
    clearRoute();
    map.removeLayer(routeLayer);
    map.removeLayer(carLayer);
  }

  return {
    routeVisible,
    currentRoute,
    isAnimating,
    drawRoute,
    clearRoute,
    dispose,
  };
}
