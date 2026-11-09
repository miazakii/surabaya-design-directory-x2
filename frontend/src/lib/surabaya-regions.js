/**
 * Batas wilayah kasar untuk lapisan diagram di peta.
 * Bukan batas administratif resmi; dipakai sebagai penanda visual.
 */
export const REGION_SHAPES = [
  {
    code: 'B-SUB',
    label: 'B-SUB',
    name: 'Surabaya Barat',
    labelAt: [112.68, -7.315],
    polygon: [
      [112.56, -7.37],
      [112.715, -7.37],
      [112.715, -7.16],
      [112.56, -7.16],
      [112.56, -7.37],
    ],
  },
  {
    code: 'U-SUB',
    label: 'U-SUB',
    name: 'Surabaya Utara',
    labelAt: [112.765, -7.225],
    polygon: [
      [112.715, -7.23],
      [112.84, -7.23],
      [112.84, -7.135],
      [112.715, -7.135],
      [112.715, -7.23],
    ],
  },
  {
    code: 'P-SUB',
    label: 'P-SUB',
    name: 'Surabaya Pusat',
    labelAt: [112.74, -7.255],
    polygon: [
      [112.715, -7.305],
      [112.8, -7.305],
      [112.8, -7.23],
      [112.715, -7.23],
      [112.715, -7.305],
    ],
  },
  {
    code: 'T-SUB',
    label: 'T-SUB',
    name: 'Surabaya Timur',
    labelAt: [112.805, -7.285],
    polygon: [
      [112.8, -7.34],
      [112.92, -7.34],
      [112.92, -7.17],
      [112.8, -7.17],
      [112.8, -7.34],
    ],
  },
  {
    code: 'S-SUB',
    label: 'S-SUB',
    name: 'Surabaya Selatan',
    labelAt: [112.755, -7.33],
    polygon: [
      [112.67, -7.4],
      [112.88, -7.4],
      [112.88, -7.305],
      [112.67, -7.305],
      [112.67, -7.4],
    ],
  },
];

export const REGION_GEOJSON = {
  type: 'FeatureCollection',
  features: REGION_SHAPES.map((shape) => ({
    type: 'Feature',
    properties: {
      code: shape.code,
      label: shape.label,
      name: shape.name,
      labelLng: shape.labelAt[0],
      labelLat: shape.labelAt[1],
    },
    geometry: {
      type: 'Polygon',
      coordinates: [shape.polygon],
    },
  })),
};
