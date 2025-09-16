<template>
  <div class="p-8 space-y-4">
    <h2 class="text-2xl font-bold mb-4">Toast Position Examples</h2>
    
    <div class="grid grid-cols-2 gap-4">
      <button 
        @click="showToast('top-left')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Top Left
      </button>
      
      <button 
        @click="showToast('top-center')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Top Center
      </button>
      
      <button 
        @click="showToast('top-right')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Top Right
      </button>
      
      <button 
        @click="showToast('bottom-left')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Bottom Left
      </button>
      
      <button 
        @click="showToast('bottom-center')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Bottom Center
      </button>
      
      <button 
        @click="showToast('bottom-right')"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Bottom Right
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { success } = useToast()

const showToast = (position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right') => {
  success(
    `Toast at ${position.replace('-', ' ')}`,
    `This toast is positioned at ${position.replace('-', ' ')}`,
    3000,
    position
  )
}
</script>
