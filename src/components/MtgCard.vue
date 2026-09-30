<script setup lang="ts">
const card = defineProps<Card>();

interface Card {
  imgUrl: string;
  name: string;
}
</script>

<template>
<img src={{card.imgUrl}} alt={{card.name}} />
</template>

<style scoped>

</style>