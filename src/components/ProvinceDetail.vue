<script setup>
import { computed } from 'vue'

const props = defineProps({
  province: {
    type: Object,
    default: null,
  },
  fallbackLabel: {
    type: String,
    default: 'Bir il seçmek için harita üzerindeki illerden birine tıklayın.',
  },
})

const hasPlains = computed(() => Boolean(props.province?.plains?.length))
const hasPlateaus = computed(() => Boolean(props.province?.plateaus?.length))
</script>

<template>
  <section class="province-detail">
    <header class="province-detail__header">
      <h2 v-if="province" class="province-detail__title">{{ province.name }}</h2>
      <h2 v-else class="province-detail__title">İl Detayı</h2>
      <p v-if="!province" class="province-detail__hint">{{ fallbackLabel }}</p>
    </header>

    <div v-if="province" class="province-detail__body">
      <article class="province-detail__block">
        <h3>Ovalar</h3>
        <ul v-if="hasPlains">
          <li v-for="item in province.plains" :key="item">{{ item }}</li>
        </ul>
        <p v-else>Bu il için ova bilgisi henüz eklenmedi.</p>
      </article>

      <article class="province-detail__block">
        <h3>Platolar ve Yaylalar</h3>
        <ul v-if="hasPlateaus">
          <li v-for="item in province.plateaus" :key="item">{{ item }}</li>
        </ul>
        <p v-else>Bu il için plato bilgisi henüz eklenmedi.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.province-detail {
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 8px 22px rgba(21, 28, 41, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid #edf0f5;
  min-height: 9rem;
}

.province-detail__header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.province-detail__title {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2a44;
}

.province-detail__hint {
  margin: 0;
  color: #5d6470;
  font-size: 0.95rem;
}

.province-detail__body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.province-detail__block {
  background-color: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 0.75rem;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.province-detail__block h3 {
  margin: 0;
  font-size: 1rem;
  color: #3a4354;
}

.province-detail__block ul {
  list-style: disc inside;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  color: #2f3342;
}

.province-detail__block p {
  margin: 0;
  color: #6f7785;
  font-size: 0.95rem;
}
</style>
