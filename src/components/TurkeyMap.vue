<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useProvinceStore } from '../stores/provinceStore'

const props = defineProps({
  backgroundImage: {
    type: String,
    default: '',
  },
  showLegend: {
    type: Boolean,
    default: true,
  },
})

const provinceStore = useProvinceStore()
const { selectedProvinceId, hoveredProvinceId } = storeToRefs(provinceStore)
const provinces = computed(() => provinceStore.provinces)
const viewBox = computed(() => provinceStore.viewBox)

const mapContainer = ref(null)
const pointerPosition = ref({ x: 0, y: 0 })

const hoveredProvinceData = computed(() => provinces.value?.find((item) => item.id === hoveredProvinceId.value) ?? null)
const selectedProvinceData = computed(() => provinces.value?.find((item) => item.id === selectedProvinceId.value) ?? null)

const tooltipProvince = computed(() => hoveredProvinceData.value ?? selectedProvinceData.value ?? null)
const hasActiveProvince = computed(() => Boolean(tooltipProvince.value))

const tooltipStyle = computed(() => ({
  left: `${pointerPosition.value.x}px`,
  top: `${pointerPosition.value.y}px`,
}))

const tooltipMetaText = computed(() => {
  const province = tooltipProvince.value
  if (!province) return ''
  const plains = province.plains?.length ?? 0
  const plateaus = province.plateaus?.length ?? 0
  if (!plains && !plateaus) {
    return 'Kayıtlı ova veya plato bilgisi yok'
  }
  return `${plains} ova · ${plateaus} plato`
})

const containerStyle = computed(() => {
  if (!props.backgroundImage) {
    return {}
  }
  return {
    '--map-custom-background': `url(${props.backgroundImage})`,
  }
})

let shouldPositionOnMount = false

watch(
  tooltipProvince,
  (province) => {
    if (!province) return
    if (!mapContainer.value) {
      shouldPositionOnMount = true
      return
    }
    updateTooltipPositionFromEvent(null, province)
  },
  { flush: 'post' },
)

onMounted(() => {
  if (shouldPositionOnMount && tooltipProvince.value) {
    updateTooltipPositionFromEvent(null, tooltipProvince.value)
    shouldPositionOnMount = false
  }
})

function getProvinceById(id) {
  return provinces.value?.find((item) => item.id === id) ?? null
}

function handlePointerMove(event) {
  updateTooltipPositionFromEvent(event)
}

function handleProvinceEnter(id, event) {
  provinceStore.setHoveredProvince(id)
  updateTooltipPositionFromEvent(event, getProvinceById(id))
}

function handleProvinceLeave() {
  provinceStore.clearHoveredProvince()
}

function handleProvinceClick(id, event) {
  provinceStore.selectProvince(id)
  updateTooltipPositionFromEvent(event, getProvinceById(id))
}

function handleProvinceKey(event, id) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    provinceStore.selectProvince(id)
    updateTooltipPositionFromEvent(null, getProvinceById(id))
  }
}

function handleSvgMouseLeave() {
  provinceStore.clearHoveredProvince()
}

function updateTooltipPositionFromEvent(event, province) {
  const container = mapContainer.value
  if (!container) return

  if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    const rect = container.getBoundingClientRect()
    pointerPosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    return
  }

  if (province) {
    const svgElement = container.querySelector('svg')
    const provinceElement = svgElement?.querySelector(`[data-id="${province.id}"]`)
    if (provinceElement && typeof provinceElement.getBBox === 'function') {
      const { x, y, width, height } = provinceElement.getBBox()
      pointerPosition.value = {
        x: x + width / 2,
        y: y + height / 2,
      }
    }
  }
}

function provinceStyle(province) {
  const isSelected = selectedProvinceId.value === province.id
  const isHovered = hoveredProvinceId.value === province.id
  const isActive = isHovered || isSelected
  const scale = isSelected ? 1.08 : isHovered ? 1.05 : 1
  const highlightFill = isActive
    ? lightenColor(province.color, isSelected ? 0.22 : 0.16)
    : province.color
  const opacity = hasActiveProvince.value && !isActive ? 0.45 : 1
  const filter = isActive
    ? 'saturate(1.25) drop-shadow(0 0 12px rgba(37, 48, 74, 0.35))'
    : hasActiveProvince.value
      ? 'saturate(0.7)'
      : 'saturate(0.9)'

  return {
    fill: highlightFill,
    transform: `scale(${scale})`,
    opacity,
    filter,
    stroke: isActive ? '#25304a' : '#ffffff',
    strokeWidth: isActive ? 1.4 : 0.9,
  }
}

function lightenColor(hex, amount = 0.15) {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!match) {
    return hex
  }

  const value = parseInt(match[1], 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff

  const adjustChannel = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount))

  const nextR = adjustChannel(r)
  const nextG = adjustChannel(g)
  const nextB = adjustChannel(b)

  const nextValue = (nextR << 16) | (nextG << 8) | nextB
  return `#${nextValue.toString(16).padStart(6, '0')}`
}
</script>

<template>
  <div ref="mapContainer" class="turkey-map" :style="containerStyle">
    <svg
      :viewBox="viewBox"
      role="img"
      aria-label="Türkiye illeri haritası"
      @mousemove="handlePointerMove"
      @mouseleave="handleSvgMouseLeave"
    >
      <title>Türkiye illeri haritası</title>
      <g class="province-list">
        <path
          v-for="province in provinces"
          :key="province.id"
          :d="province.path"
          class="province-shape"
          :data-id="province.id"
          :style="provinceStyle(province)"
          role="button"
          tabindex="0"
          :aria-pressed="selectedProvinceId === province.id"
          :aria-label="`${province.name} ili`"
          @mouseenter="(event) => handleProvinceEnter(province.id, event)"
          @focus="(event) => handleProvinceEnter(province.id, event)"
          @mouseleave="handleProvinceLeave"
          @blur="handleProvinceLeave"
          @click="(event) => handleProvinceClick(province.id, event)"
          @keyup="(event) => handleProvinceKey(event, province.id)"
        >
          <title>{{ province.name }}</title>
        </path>
      </g>
    </svg>

    <transition name="map-tooltip">
      <div v-if="tooltipProvince" class="map-tooltip" :style="tooltipStyle">
        <strong>{{ tooltipProvince.name }}</strong>
        <span v-if="tooltipMetaText" class="map-tooltip__meta">{{ tooltipMetaText }}</span>
      </div>
    </transition>

    <div v-if="showLegend" class="map-legend">
      <span class="map-legend__title">İlleri keşfetmek için haritayı kullanın.</span>
      <span class="map-legend__hint">Hover ile büyüt, tıklayarak seç. Klavye için Enter veya boşluk.</span>
    </div>
  </div>
</template>

<style scoped>
.turkey-map {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 20%, #f8fafc 0%, #e2e8f0 45%, #d2dcf5 100%);
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid #dfe3ef;
  box-shadow: 0 18px 36px rgba(19, 28, 54, 0.12);
  overflow: hidden;
}

.turkey-map::after {
  content: '';
  position: absolute;
  inset: 1.25rem;
  background-image: var(--map-custom-background);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.15;
  pointer-events: none;
}

svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  display: block;
  pointer-events: auto;
}

.province-list {
  fill: none;
  stroke: transparent;
  stroke-width: 0;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.province-shape {
  cursor: pointer;
  transform-origin: center;
  transform-box: fill-box;
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out,
    filter 220ms ease-out,
    stroke-width 220ms ease-out;
  mix-blend-mode: multiply;
}

.province-shape:focus-visible {
  outline: 2px solid #25304a;
  outline-offset: 3px;
}

.map-tooltip {
  position: absolute;
  z-index: 2;
  padding: 0.45rem 0.75rem;
  background: rgba(31, 42, 68, 0.92);
  color: #ffffff;
  border-radius: 999px;
  font-size: 0.9rem;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  transform: translate(-50%, -120%);
  pointer-events: none;
  box-shadow: 0 12px 32px rgba(17, 24, 39, 0.35);
  white-space: nowrap;
}

.map-tooltip__meta {
  font-size: 0.7rem;
  opacity: 0.75;
}

.map-tooltip-enter-active,
.map-tooltip-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.map-tooltip-enter-from,
.map-tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -110%);
}

.map-legend {
  position: absolute;
  left: 1.5rem;
  bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #1f2a44;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.14);
  pointer-events: none;
}

.map-legend__title {
  font-weight: 600;
}

.map-legend__hint {
  opacity: 0.75;
}

@media (max-width: 720px) {
  .turkey-map {
    padding: 1rem;
    border-radius: 1rem;
  }

  .map-legend {
    left: 1rem;
    bottom: 1rem;
    font-size: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .province-shape {
    transition: none;
  }

  .map-tooltip-enter-active,
  .map-tooltip-leave-active {
    transition: none;
  }
}
</style>
