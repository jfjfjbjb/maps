import * as Cesium from 'cesium';

// 实体
const useEntity = ({ viewer }) => {
  const entities = {};

  // 1. 矩形 - 红色半透明
  entities.rectangle = viewer.entities.add({
    name: '矩形',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray([
          106.4, 29.4,
          106.7, 29.4,
          106.7, 29.55,
          106.4, 29.55,
        ])
      ),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
    }
  });

  // 2. 点标记
  entities.point = viewer.entities.add({
    name: '点标记',
    position: Cesium.Cartesian3.fromDegrees(106.55, 29.45, 100),
    point: {
      pixelSize: 15,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 3,
    }
  });

  // 3. 标签
  entities.label = viewer.entities.add({
    name: '标签',
    position: Cesium.Cartesian3.fromDegrees(106.6, 29.5, 100),
    label: {
      text: '重庆市区',
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10),
    }
  });

  // 4. 立方体
  entities.box = viewer.entities.add({
    name: '立方体',
    position: Cesium.Cartesian3.fromDegrees(106.5, 29.6, 2000),
    box: {
      dimensions: new Cesium.Cartesian3(3000.0, 3000.0, 3000.0),
      material: Cesium.Color.BLUE.withAlpha(0.7),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    }
  });

  // 5. 圆
  entities.circle = viewer.entities.add({
    name: '圆',
    position: Cesium.Cartesian3.fromDegrees(106.65, 29.35, 100),
    ellipse: {
      semiMinorAxis: 3000.0,
      semiMajorAxis: 3000.0,
      material: Cesium.Color.PURPLE.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.DARK_GREEN,
    }
  });

  // 6. 折线
  entities.polyline = viewer.entities.add({
    name: '折线',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        106.3, 29.5,
        106.4, 29.6,
        106.5, 29.5,
        106.6, 29.65,
      ]),
      width: 5,
      material: new Cesium.ColorMaterialProperty(Cesium.Color.CYAN),
    }
  });

  // 7. 球体
  entities.sphere = viewer.entities.add({
    name: '球体',
    position: Cesium.Cartesian3.fromDegrees(106.75, 29.55, 1500),
    ellipsoid: {
      radii: new Cesium.Cartesian3(2000.0, 2000.0, 2000.0),
      material: Cesium.Color.PURPLE.withAlpha(0.6),
      outline: true,
      outlineColor: Cesium.Color.MAGENTA,
    }
  });

  // 8. 走廊（带状区域）
  entities.corridor = viewer.entities.add({
    name: '走廊',
    corridor: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        106.35, 29.3,
        106.45, 29.35,
        106.5, 29.32,
        106.6, 29.4,
      ]),
      width: 5000,
      material: Cesium.Color.ORANGE.withAlpha(0.6),
      outline: true,
      outlineColor: Cesium.Color.DARK_ORANGE,
    }
  });

  // 9. 广告牌
  const pinImage = new Cesium.PinBuilder().fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL();
  entities.billboard = viewer.entities.add({
    name: '广告牌',
    position: Cesium.Cartesian3.fromDegrees(106.55, 29.65, 100),
    billboard: {
      image: pinImage,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      width: 80,
      height: 40,
    }
  });

  // 10. 模型
  entities.model = viewer.entities.add({
    name: '模型',
    position: Cesium.Cartesian3.fromDegrees(106.4, 29.65, 500),
    model: {
      uri: '/models/GroundVehicle.glb',
      scale: 200,
      minimumPixelSize: 32,
      maximumScale: 50000,
      allowPicking: false,
    }
  });

  // 隐藏所有实体
  Object.values(entities).forEach(entity => {
    entity.show = false;
  });

  return entities;
};

export default useEntity;
