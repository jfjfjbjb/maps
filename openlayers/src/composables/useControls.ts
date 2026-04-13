import Zoom from "ol/control/Zoom";
import Rotate from "ol/control/Rotate";
import Control from "ol/control/Control";
import Map from "ol/Map";

export interface UseControlsOptions {
  map: Map;
}

export function useControls({ map }: UseControlsOptions) {
  const controls: Control[] = [
    new Zoom(),
    new Rotate(),
    // new Attribution(),
    // new ScaleLine(),
    // new FullScreen(),
    // new MousePosition(),
    // new OverviewMap(),
    // new ZoomSlider(),
  ];

  controls.forEach((control) => map.addControl(control));

  function dispose() {
    controls.forEach((control) => map.removeControl(control));
  }

  return { controls, dispose };
}
