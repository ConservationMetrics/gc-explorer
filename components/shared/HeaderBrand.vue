<script setup lang="ts">
import { withBase } from "ufo";

const logoSrc = withBase("/gcexplorer.png", useRuntimeConfig().app.baseURL);
</script>

<template>
  <NuxtLink
    to="/"
    class="flex max-[1000px]:min-w-0 max-[1000px]:flex-1 max-[1000px]:mr-0 items-center gap-1 min-[1001px]:mr-6 min-[1109px]:mr-10 min-[1230px]:mr-14"
  >
    <img
      :src="logoSrc"
      alt="Guardian Connector Explorer"
      class="h-10 w-auto shrink-0"
    />
    <div class="min-w-0 rounded-lg py-2 pl-0 pr-1 min-[1001px]:pr-2">
      <h1 class="m-0 text-lg font-bold leading-tight whitespace-nowrap">
        Guardian Connector
      </h1>
    </div>
  </NuxtLink>
</template>
