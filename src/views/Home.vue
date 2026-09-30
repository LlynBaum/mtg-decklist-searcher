<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";

const url = ref("");
const router = useRouter();

async function loadDeck() {
  let deckId = url.value;
  if (deckId.includes("moxfield.com")) {
    const split = deckId.split("/");
    deckId = split[split.length - 1]!;
  }

  await router.push({
    name: "deck",
    params: { deckId: deckId }
  });
}
</script>

<template>
  <input type="text" v-model.trim="url">

  <button v-on:click="loadDeck">
    Load
  </button>
</template>

<style scoped>

</style>
