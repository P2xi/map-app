<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import TurkeyMap from './components/TurkeyMap.vue'
import ProvinceDetail from './components/ProvinceDetail.vue'
import { useProvinceStore } from './stores/provinceStore'

const provinceStore = useProvinceStore()
const { selectedProvince, hoveredProvince } = storeToRefs(provinceStore)

const activeProvince = computed(() => selectedProvince.value ?? hoveredProvince.value ?? null)

function clearSelection() {
  provinceStore.clearSelection()
  provinceStore.clearHoveredProvince()
}
</script>

<template>
  <main class="app-layout">
    <header class="app-header">
      <div class="app-header__text">
        <h1>Türkiye Coğrafya Haritası</h1>
        <p>
          Harita üzerindeki illeri keşfedin ve yerel ova ile plato bilgilerine hızlıca ulaşın. Verilerin
          tamamı yerelde tutulur, internet bağlantısına gerek yoktur.
        </p>
      </div>
      <button type="button" class="reset-button" @click="clearSelection">Seçimi Temizle</button>
    </header>

    <section class="map-section">
      <TurkeyMap class="map-panel" />
    </section>

    <section class="info-section">
      <ProvinceDetail class="info-panel" :province="activeProvince" />
    </section>
  </main>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  padding: 1.5rem 3vw 3rem;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.app-header__text {
  max-width: 48rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.85rem;
  color: #15213b;
}

.app-header p {
  margin: 0;
  color: #4c566a;
  font-size: 1rem;
  line-height: 1.55;
}

.reset-button {
  border: none;
  background: #1f2a44;
  color: #ffffff;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.93rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reset-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(31, 42, 68, 0.18);
}

.reset-button:active {
  transform: translateY(0);
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-panel {
  min-height: 26rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-panel {
  margin-top: 0;
}

@media (max-width: 960px) {
  .app-layout {
    padding: 1.25rem 5vw 2.5rem;
  }

  .map-panel {
    min-height: 22rem;
  }
}
</style>
