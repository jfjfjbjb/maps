import { extend } from "ol/extent";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Overlay from "ol/Overlay";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Map from "ol/Map";

export interface UseSchoolAnnotationOptions {
  map: Map;
}

export function useSchoolAnnotation({ map }: UseSchoolAnnotationOptions) {
  // 数据源
  const schoolSource = new VectorSource();
  const clusterSource = new Cluster({
    source: schoolSource,
    distance: 40,
    minDistance: 20,
  });

  // 图层
  const schoolLayer = new VectorLayer({
    source: clusterSource,
    style: (feature) => {
      const features = feature.get("features");
      const size = features.length;

      if (size === 1) {
        return new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: "#2196F3" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        });
      } else {
        const clusterRadius = Math.min(8 + size * 1.5, 25);
        return new Style({
          image: new Circle({
            radius: clusterRadius,
            fill: new Fill({ color: "#4CAF50" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: "#fff" }),
            font: "bold 12px sans-serif",
          }),
        });
      }
    },
    zIndex: 10,
  });

  map.addLayer(schoolLayer);

  // 创建弹窗overlay
  const popupElement = document.createElement("div");
  popupElement.className = "school-popup";
  popupElement.innerHTML = `<div class="popup-content"><div class="popup-text"></div></div>`;
  popupElement.style.display = "none";
  document.body.appendChild(popupElement);

  const overlay = new Overlay({
    element: popupElement,
    positioning: "top-center",
    offset: [-60, -80],
    stopEvent: false,
  });
  map.addOverlay(overlay);

  // 点击事件 - 聚合点缩放
  map.on("click", (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

    if (feature) {
      const features = feature.get("features");
      if (features && features.length > 1) {
        const extent: number[] = [Infinity, Infinity, -Infinity, -Infinity];
        features.forEach((f: Feature) => {
          const geom = f.getGeometry();
          if (geom) {
            extend(extent, geom.getExtent());
          }
        });
        map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 });
      }
    }
  });

  // Hover 事件 - 显示 popup
  map.on("pointermove", (evt) => {
    const pixel = map.getEventPixel(evt.originalEvent);
    const feature = map.forEachFeatureAtPixel(pixel, (f) => f);
    map.getTargetElement().style.cursor = feature ? "pointer" : "";

    if (feature) {
      const features = feature.get("features");
      if (features && features.length === 1) {
        const name = features[0].get("name");
        const geometry = features[0].getGeometry();
        if (geometry) {
          const coordinate = (geometry as Point).getCoordinates();
          const textEl = popupElement.querySelector(".popup-text") as HTMLElement;
          if (textEl) textEl.textContent = name;
          popupElement.style.display = "block";
          overlay.setPosition(coordinate);
        }
      } else {
        popupElement.style.display = "none";
      }
    } else {
      popupElement.style.display = "none";
    }
  });

  // 关闭按钮
  const onCloseClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("popup-close")) {
      popupElement.style.display = "none";
    }
  };
  document.addEventListener("click", onCloseClick);

  // 添加学校
  function addSchool(lon: number, lat: number, name: string) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
      name,
    });
    schoolSource.addFeature(feature);
  }

  // 清理函数
  function dispose() {
    document.removeEventListener("click", onCloseClick);
    popupElement.remove();
    map.removeLayer(schoolLayer);
  }

  /** 清空所有学校标注 */
  function clearAll() {
    schoolSource.clear();
  }

  return { addSchool, clearAll, dispose };
}
