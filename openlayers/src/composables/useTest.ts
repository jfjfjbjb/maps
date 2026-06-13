import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Point, LineString, Polygon, MultiPoint, MultiLineString, Circle } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Style, Circle as CircleStyle, Fill, Stroke, Text, RegularShape } from "ol/style";

export interface UseTestOptions {
  map: Map;
}

export function useTest({ map }: UseTestOptions) {
  let testLayer: VectorLayer<VectorSource> | null = null;

  function addTestLayer() {
    if (testLayer) return testLayer;

    // 中心参考点（3857坐标）
    const cx = 106.551294;
    const cy = 29.533155;

    // ── Polygon 用原始经纬度构建后整体投影 ──
    const rectPoly = new Polygon([
      [
        [cx - 0.02, cy - 0.02],
        [cx + 0.02, cy - 0.02],
        [cx + 0.02, cy - 0.04],
        [cx - 0.02, cy - 0.04],
        [cx - 0.02, cy - 0.02],
      ],
    ]);
    rectPoly.transform("EPSG:4326", "EPSG:3857");

    // ── MultiLineString 用原始经纬度构建后整体投影 ──
    const multiLine = new MultiLineString([
      [
        [cx + 0.02, cy - 0.06],
        [cx + 0.04, cy - 0.06],
      ],
      [
        [cx + 0.04, cy - 0.06],
        [cx + 0.06, cy - 0.07],
      ],
    ]);
    multiLine.transform("EPSG:4326", "EPSG:3857");

    // ── Circle 几何 ──
    const circleGeom = new Circle(fromLonLat([cx + 0.05, cy - 0.03]), 1200);

    testLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          // ── Point 系列 ──
          new Feature({
            geometry: new Point(fromLonLat([cx - 0.08, cy + 0.06])),
            name: "圆形",
            type: "point",
          }),
          new Feature({
            geometry: new Point(fromLonLat([cx - 0.03, cy + 0.06])),
            name: "三角形",
            type: "point-triangle",
          }),
          new Feature({
            geometry: new Point(fromLonLat([cx + 0.02, cy + 0.06])),
            name: "星形",
            type: "point-star",
          }),
          new Feature({
            geometry: new Point(fromLonLat([cx + 0.07, cy + 0.06])),
            name: "方形",
            type: "point-square",
          }),

          // ── LineString 系列 ──
          new Feature({
            geometry: new LineString([
              fromLonLat([cx - 0.08, cy + 0.02]),
              fromLonLat([cx - 0.02, cy + 0.02]),
            ]),
            name: "实线",
            type: "line-solid",
          }),
          new Feature({
            geometry: new LineString([
              fromLonLat([cx + 0.02, cy + 0.02]),
              fromLonLat([cx + 0.08, cy + 0.02]),
            ]),
            name: "虚线",
            type: "line-dashed",
          }),

          // ── Polygon ──
          new Feature({
            geometry: new Polygon([
              [
                fromLonLat([cx - 0.08, cy - 0.02]),
                fromLonLat([cx - 0.04, cy - 0.02]),
                fromLonLat([cx - 0.06, cy - 0.04]),
                fromLonLat([cx - 0.08, cy - 0.02]),
              ],
            ]),
            name: "三角形面",
            type: "polygon",
          }),
          new Feature({
            geometry: rectPoly,
            name: "矩形面",
            type: "polygon",
          }),

          // ── Circle ──
          new Feature({
            geometry: circleGeom,
            name: "圆形面",
            type: "circle",
          }),

          // ── MultiPoint ──
          new Feature({
            geometry: new MultiPoint([
              fromLonLat([cx - 0.05, cy - 0.06]),
              fromLonLat([cx - 0.03, cy - 0.06]),
              fromLonLat([cx - 0.01, cy - 0.06]),
            ]),
            name: "多点",
            type: "multipoint",
          }),

          // ── MultiLineString ──
          new Feature({
            geometry: multiLine,
            name: "多线",
            type: "multiline",
          }),
        ],
      }),
      style: (feature) => {
        const geom = feature.getGeometry();
        const type = feature.get("type") as string;
        const name = feature.get("name") as string;
        const styles: Style[] = [];

        if (!geom) return styles;

        const geomType = geom.getType();

        // ── Line 样式 ──
        if (geomType === "LineString" || geomType === "MultiLineString") {
          const isDashed = type === "line-dashed";
          styles.push(
            new Style({
              stroke: new Stroke({
                color: "#ff3b30",
                width: 3,
                lineDash: isDashed ? [8, 6] : undefined,
              }),
            }),
          );
        }

        // ── Polygon / Circle 样式 ──
        if (geomType === "Polygon" || geomType === "Circle") {
          styles.push(
            new Style({
              fill: new Fill({ color: "rgba(76, 175, 80, 0.15)" }),
              stroke: new Stroke({ color: "#4CAF50", width: 2 }),
            }),
          );
        }

        // ── Point / MultiPoint 样式 ──
        if (geomType === "Point" || geomType === "MultiPoint") {
          switch (type) {
            case "point-triangle":
              styles.push(
                new Style({
                  image: new RegularShape({
                    radius: 10,
                    points: 3,
                    fill: new Fill({ color: "#FF9800" }),
                    stroke: new Stroke({ color: "#fff", width: 1 }),
                  }),
                }),
              );
              break;
            case "point-star":
              styles.push(
                new Style({
                  image: new RegularShape({
                    radius: 10,
                    points: 5,
                    fill: new Fill({ color: "#9C27B0" }),
                    stroke: new Stroke({ color: "#fff", width: 1 }),
                  }),
                }),
              );
              break;
            case "point-square":
              styles.push(
                new Style({
                  image: new RegularShape({
                    radius: 10,
                    points: 4,
                    angle: Math.PI / 4,
                    fill: new Fill({ color: "#00BCD4" }),
                    stroke: new Stroke({ color: "#fff", width: 1 }),
                  }),
                }),
              );
              break;
            default:
              // 默认圆形
              styles.push(
                new Style({
                  image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: "#ff3b30" }),
                    stroke: new Stroke({ color: "#fff", width: 2 }),
                  }),
                }),
              );
          }
        }

        // ── 文字标注（按几何类型调整位置）──
        const textOffsetY =
          geomType === "Point" || geomType === "MultiPoint" ? -18 :
          geomType === "Circle" || geomType === "Polygon" ? 0 :
          14; // LineString / MultiLineString

        styles.push(
          new Style({
            text: new Text({
              text: name,
              font: "14px sans-serif",
              fill: new Fill({ color: "#333" }),
              stroke: new Stroke({ color: "#fff", width: 3 }),
              offsetY: textOffsetY,
            }),
          }),
        );

        return styles;
      },
      zIndex: 9999,
    });

    map.addLayer(testLayer);
    return testLayer;
  }

  function dispose() {
    if (testLayer) {
      map.removeLayer(testLayer);
      testLayer = null;
    }
  }

  return {
    addTestLayer,
    dispose,
  };
}
