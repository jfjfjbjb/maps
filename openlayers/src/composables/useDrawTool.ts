import { ref } from "vue";
import Draw, { DrawEvent } from "ol/interaction/Draw";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";
import { getArea, getLength } from "ol/sphere";
import { LineString, Polygon, Point } from "ol/geom";
import { transform } from "ol/proj";

export type DrawType = "Point" | "LineString" | "Polygon" | "Circle" | "None";

export interface UseDrawToolOptions {
  map: Map;
}

export function useDrawTool({ map }: UseDrawToolOptions) {
  const activeType = ref<DrawType>("None");
  const features = ref<{ type: DrawType; coords: string; area?: number; length?: number }[]>([]);

  // 矢量图层用于显示绘制的要素
  const vectorLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: "#4a90e2",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(74, 144, 226, 0.2)",
      }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: "#4a90e2",
        }),
      }),
    }),
  });

  map.addLayer(vectorLayer);

  let drawInteraction: Draw | null = null;

  function startDraw(type: DrawType) {
    if (type === "None") {
      stopDraw();
      return;
    }

    stopDraw();

    const geometryType = type === "Circle" ? "Point" : type;
    drawInteraction = new Draw({
      source: vectorLayer.getSource()!,
      type: geometryType as any,
    });

    drawInteraction.on("drawend", (event: DrawEvent) => {
      const feature = event.feature;
      const geometry = feature.getGeometry();

      let info: { type: DrawType; coords: string; area?: number; length?: number } = {
        type,
        coords: "",
      };

      if (geometry instanceof Polygon) {
        info.area = getArea(geometry);
        info.coords = formatPolygonCoords(geometry, info.area);
      } else if (geometry instanceof LineString) {
        info.length = getLength(geometry);
        info.coords = formatLineCoords(geometry);
      } else if (geometry instanceof Point) {
        info.coords = formatPointCoords(geometry);
      }

      features.value.push(info);
    });

    map.addInteraction(drawInteraction);
    activeType.value = type;
  }

  function stopDraw() {
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
      drawInteraction = null;
    }
    activeType.value = "None";
  }

  function clearAll() {
    vectorLayer.getSource()?.clear();
    features.value = [];
    stopDraw();
  }

  function formatPointCoords(geometry: Point): string {
    const [x, y] = geometry.getCoordinates();
    const [lon, lat] = transform([x, y], "EPSG:3857", "EPSG:4326");
    return `${lon.toFixed(2)}, ${lat.toFixed(2)}`;
  }

  function formatLineCoords(geometry: LineString): string {
    const coords = geometry.getCoordinates();
    const len = getLength(geometry);
    const lenStr = len >= 1000 ? `${(len / 1000).toFixed(2)} km` : `${len.toFixed(2)} m`;
    const [lon1, lat1] = transform(coords[0], "EPSG:3857", "EPSG:4326");
    const [lon2, lat2] = transform(coords[coords.length - 1], "EPSG:3857", "EPSG:4326");
    return `${lon1.toFixed(2)}, ${lat1.toFixed(2)} → ${lon2.toFixed(2)}, ${lat2.toFixed(2)} | ${lenStr}`;
  }

  function formatPolygonCoords(geometry: Polygon, area: number): string {
    const coords = geometry.getCoordinates()[0];
    const areaStr = area >= 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toFixed(2)} m²`;
    return `${coords.length - 1} 个顶点 | ${areaStr}`;
  }

  function dispose() {
    stopDraw();
    map.removeLayer(vectorLayer);
  }

  return {
    activeType,
    features,
    startDraw,
    stopDraw,
    clearAll,
    dispose,
  };
}
