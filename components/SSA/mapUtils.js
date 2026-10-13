import { booleanPointInPolygon, point } from "@turf/turf";

export function isPointOnLand(lat, lon, countriesGeoJSON) {
  if (!countriesGeoJSON) return false;

  const pt = point([lon, lat]);

  for (const feature of countriesGeoJSON.features) {
    const geometryType = feature.geometry?.type;

    if (geometryType === "Polygon") {
      if (booleanPointInPolygon(pt, feature)) {
        return true;
      }
    }

    if (geometryType === "MultiPolygon") {
      for (const coordinates of feature.geometry.coordinates) {
        const polygonFeature = {
          type: "Feature",
          properties: feature.properties || {},
          geometry: {
            type: "Polygon",
            coordinates,
          },
        };

        if (booleanPointInPolygon(pt, polygonFeature)) {
          return true;
        }
      }
    }
  }

  return false;
}