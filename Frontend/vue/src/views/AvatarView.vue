<script setup>
import { ref } from 'vue'
import { getAuth, updateProfile } from 'firebase/auth'
import { useRouter } from 'vue-router'


import doakes from '../assets/doakes.jpeg'
import perro from '../assets/perro.jpg'
import gogeta from '../assets/gogeta.jpg'
import caballo from '../assets/caballo.jpg'
import gustavo from '../assets/gustavo.jpg'
const router = useRouter()
const auth = getAuth()

const avatares = [
  doakes,
  perro,
  gogeta,
  caballo,
  gustavo,
]

const avatarSeleccionado = ref(null)

async function confirmar() {
  await updateProfile(auth.currentUser, { photoURL: avatarSeleccionado.value })
  router.push('/WhatsApp')
}
</script>

<template>
  <div class="av-layout">
    <div class="av-card">
      <h1>Elige tu avatar</h1>
      <p>Selecciona una imagen para tu perfil</p>

      <div class="av-grid">
        <img
          v-for="(av, i) in avatares"
          :key="i"
          :src="av"
          class="av-opcion"
          :class="{ 'av-opcion--activo': av === avatarSeleccionado }"
          @click="avatarSeleccionado = av"
        />
      </div>

      <button
        class="av-btn"
        :disabled="!avatarSeleccionado"
        @click="confirmar"
      >
        Continuar
      </button>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:global(body) {
  background: #111b21;
}

.av-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #111b21;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.av-card {
  background: #202c33;
  border-radius: 12px;
  padding: 40px 36px;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

h1 {
  color: #e9edef;
  font-size: 22px;
  font-weight: 600;
}

p {
  color: #8696a0;
  font-size: 14px;
}

.av-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.av-opcion {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border 0.2s, transform 0.2s;
}

.av-opcion:hover {
  transform: scale(1.08);
}

.av-opcion--activo {
  border-color: #00a884;
  transform: scale(1.08);
}

.av-btn {
  width: 100%;
  padding: 12px;
  background: #00a884;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.av-btn:hover:not(:disabled) {
  background: #008069;
}

.av-btn:disabled {
  background: #2a3942;
  color: #8696a0;
  cursor: not-allowed;
}
</style>