<script setup lang="ts">
  import {ref} from "vue";

  const url = ref("");

  function loadDeck() {
    // TODO: parse url and get ID
    // TODO: route to new view and load deck list
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
