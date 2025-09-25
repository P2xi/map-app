import fs from 'fs'

const geo = JSON.parse(fs.readFileSync(new URL('../src/data/turkey-provinces.geojson', import.meta.url)))
const features = geo.features ?? []

if (!features.length) {
  throw new Error('GeoJSON içerisinde il bulunamadı.')
}

function iterateCoordinates(geometry, callback) {
  if (!geometry) return
  const { type, coordinates } = geometry

  if (type === 'Point') {
    callback(coordinates)
    return
  }

  if (type === 'MultiPoint' || type === 'LineString') {
    coordinates.forEach(callback)
    return
  }

  if (type === 'MultiLineString' || type === 'Polygon') {
    coordinates.forEach((line) => line.forEach(callback))
    return
  }

  if (type === 'MultiPolygon') {
    coordinates.forEach((polygon) => polygon.forEach((line) => line.forEach(callback)))
  }
}

function computeBounds(feats) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const feature of feats) {
    iterateCoordinates(feature.geometry, ([lon, lat]) => {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }

  return { minLon, maxLon, minLat, maxLat }
}

const bounds = computeBounds(features)
const width = 1200
const lonSpan = bounds.maxLon - bounds.minLon || 1
const latSpan = bounds.maxLat - bounds.minLat || 1
const height = width * (latSpan / lonSpan)

function projectPoint([lon, lat]) {
  const x = ((lon - bounds.minLon) / lonSpan) * width
  const y = ((bounds.maxLat - lat) / latSpan) * height
  return [x, y]
}

function polygonToPath(rings) {
  return rings
    .map((ring) => {
      return ring
        .map((point, index) => {
          const [x, y] = projectPoint(point)
          const command = index === 0 ? 'M' : 'L'
          return `${command}${x.toFixed(2)} ${y.toFixed(2)}`
        })
        .join(' ')
    })
    .map((segment) => `${segment} Z`)
    .join(' ')
}

function geometryToPath(geometry) {
  if (!geometry) return ''
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates)
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygonToPath(polygon)).join(' ')
  }
  return ''
}

const palette = [
  '#f97316',
  '#facc15',
  '#4ade80',
  '#2dd4bf',
  '#38bdf8',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f87171',
  '#fb7185',
  '#c084fc',
  '#34d399',
]

const pathElements = features
  .map((feature, index) => {
    const d = geometryToPath(feature.geometry)
    const color = palette[index % palette.length]
    const name = feature.properties?.name ?? `Province ${index + 1}`
    return `    <path d="${d}" fill="${color}" stroke="#ffffff" stroke-width="1.4" data-name="${name}"/>`
  })
  .join('\n')

const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(
  2,
)} ${height.toFixed(
  2,
)}">\n  <rect width="100%" height="100%" fill="#f7f7f7"/>\n  <g>${pathElements}\n  </g>\n</svg>\n`

fs.writeFileSync(new URL('../public/turkey-map.svg', import.meta.url), svg, 'utf8')
console.log('Hazır harita SVG dosyası oluşturuldu: public/turkey-map.svg')
