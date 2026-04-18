import { ref } from "vue";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill, Icon } from "ol/style";
import { LineString, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import locationIcon from "../assets/location.svg?url";

// 地点坐标（重庆）
const LOCATIONS: Record<string, [number, number]> = {
  flowerGarden: fromLonLat([106.5129, 29.5830]) as [number, number], // 花卉园
  grandTheater: fromLonLat([106.5769, 29.5695]) as [number, number], // 大剧院
};

export interface UseRouteSimulationOptions {
  map: Map;
}

export function useRouteSimulation({ map }: UseRouteSimulationOptions) {
  const routeVisible = ref(false);
  const currentRoute = ref<"flowerGarden" | "grandTheater" | null>(null);

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
            scale: isStart || isEnd ? 0.15 : 0.08,
            anchor: [0.5, 1],
          }),
        });
      }

      // 路径线样式
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

  map.addLayer(routeLayer);

  // 生成模拟路径（带一些中间点使其看起来更自然）
  function generateSimulatedRoute(
    start: [number, number],
    end: [number, number]
  ): [number, number][] {
    const points: [number, number][] = [start];

    // 添加几个中间点模拟真实路径
    const midX1 = start[0] + (end[0] - start[0]) * 0.3;
    const midY1 = start[1] + (end[1] - start[1]) * 0.4;
    const midX2 = start[0] + (end[0] - start[0]) * 0.6;
    const midY2 = start[1] + (end[1] - start[1]) * 0.7;
    const midX3 = start[0] + (end[0] - start[0]) * 0.85;
    const midY3 = start[1] + (end[1] - start[1]) * 0.9;

    points.push([midX1, midY1]);
    points.push([midX2, midY2]);
    points.push([midX3, midY3]);
    points.push(end);

    return points;
  }

  function drawRoute(from: "flowerGarden" | "grandTheater") {
    // 清除之前的路径
    clearRoute();

    const start =
      from === "flowerGarden" ? LOCATIONS.flowerGarden : LOCATIONS.grandTheater;
    const end =
      from === "flowerGarden" ? LOCATIONS.grandTheater : LOCATIONS.flowerGarden;

    // 创建起点
    const startFeature = new Feature({
      geometry: new Point(start),
    });
    startFeature.set("isStart", true);

    // 创建终点
    const endFeature = new Feature({
      geometry: new Point(end),
    });
    endFeature.set("isEnd", true);

    // 生成模拟路径
    const routeCoords = generateSimulatedRoute(start, end);
    const routeLine = new LineString(routeCoords);

    const routeFeature = new Feature({
      geometry: routeLine,
    });

    // 添加到图层
    routeLayer.getSource()?.addFeatures([startFeature, endFeature, routeFeature]);

    routeVisible.value = true;
    currentRoute.value = from;
  }

  function clearRoute() {
    routeLayer.getSource()?.clear();
    routeVisible.value = false;
    currentRoute.value = null;
  }

  function dispose() {
    clearRoute();
    map.removeLayer(routeLayer);
  }

  return {
    routeVisible,
    currentRoute,
    drawRoute,
    clearRoute,
    dispose,
  };
}
