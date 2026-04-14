import Zoom from "ol/control/Zoom";
import Rotate from "ol/control/Rotate";
import Control from "ol/control/Control";
import Map from "ol/Map";
import { MousePosition, ScaleLine, ZoomSlider } from "ol/control";
import { createStringXY } from "ol/coordinate";

export interface UseControlsOptions {
  map: Map;
}

export function useControls({ map }: UseControlsOptions) {
  const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(6), // 保留6位小数
    projection: "EPSG:4326", // 显示经纬度坐标系
    className: "mouse-position-control",
  });

  const controls: Control[] = [
    new Zoom(),
    new Rotate(),
    // new Attribution(),
    new ScaleLine(),
    // new FullScreen(),
    mousePositionControl,
    // new OverviewMap(),
    new ZoomSlider(),
  ];

  controls.forEach((control) => map.addControl(control));

  function dispose() {
    controls.forEach((control) => map.removeControl(control));
  }

  return { controls, dispose };
}
