import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import provincesGeoJsonRaw from '../data/turkey-provinces.geojson?raw'
import { provinceGeography } from '../data/province-geography'

const provincesById = new Map()
const provincesGeoJson = JSON.parse(provincesGeoJsonRaw)
const processed = prepareProvinces(provincesGeoJson, provinceGeography)

export const useProvinceStore = defineStore('province', () => {
  const selectedProvinceId = ref(null)
  const hoveredProvinceId = ref(null)

  const provinces = processed.provinces
  const viewBox = processed.viewBox

  const selectedProvince = computed(() => provincesById.get(selectedProvinceId.value) ?? null)
  const hoveredProvince = computed(() => provincesById.get(hoveredProvinceId.value) ?? null)

  function selectProvince(id) {
    selectedProvinceId.value = id
  }

  function clearSelection() {
    selectedProvinceId.value = null
  }

  function setHoveredProvince(id) {
    hoveredProvinceId.value = id
  }

  function clearHoveredProvince() {
    hoveredProvinceId.value = null
  }

  return {
    provinces,
    viewBox,
    selectedProvinceId,
    hoveredProvinceId,
    selectedProvince,
    hoveredProvince,
    selectProvince,
    clearSelection,
    setHoveredProvince,
    clearHoveredProvince,
  }
})

function prepareProvinces(geoJson, geographyMap) {
  const features = geoJson?.features ?? []
  if (!features.length) {
    provincesById.clear()
    return { provinces: [], viewBox: '0 0 1000 600' }
  }

  const bounds = computeBounds(features)
  const projection = createProjection(bounds)
  const palette = ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA', '#FF99C3', '#9DD96C']

  provincesById.clear()

  const provinces = features.map((feature, index) => {
    const id = feature.properties?.number ?? index
    const name = feature.properties?.name ?? `Province ${index + 1}`
    const path = geometryToPath(feature.geometry, projection.projectPoint)

    const geography = geographyMap[name] ?? { plains: [], plateaus: [] }
    const color = palette[index % palette.length]

    const province = Object.freeze({
      id,
      name,
      path,
      color,
      plains: geography.plains ?? [],
      plateaus: geography.plateaus ?? [],
    })

    provincesById.set(id, province)
    return province
  })

  const viewBox = `0 0 ${projection.width.toFixed(2)} ${projection.height.toFixed(2)}`

  return { provinces, viewBox }
}

function computeBounds(features) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const feature of features) {
    iterateCoordinates(feature.geometry, ([lon, lat]) => {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }

  return { minLon, maxLon, minLat, maxLat }
}

function createProjection(bounds) {
  const width = 1000
  const lonSpan = bounds.maxLon - bounds.minLon || 1
  const latSpan = bounds.maxLat - bounds.minLat || 1
  const aspectRatio = latSpan / lonSpan
  const height = width * aspectRatio

  const projectPoint = ([lon, lat]) => {
    const x = ((lon - bounds.minLon) / lonSpan) * width
    const y = ((bounds.maxLat - lat) / latSpan) * height
    return [x, y]
  }

  return { width, height, projectPoint }
}

function geometryToPath(geometry, projectPoint) {
  if (!geometry) return ''

  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates, projectPoint)
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .map((polygon) => polygonToPath(polygon, projectPoint))
      .join(' ')
  }

  return ''
}

function polygonToPath(rings, projectPoint) {
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
