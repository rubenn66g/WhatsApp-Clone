<script setup>
import { ref } from 'vue'
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import { supabase } from '../supabase'
const URL = import.meta.env.PROD 
  ? 'https://whatsapp-clone-9hh6.onrender.com' 
  : 'http://localhost:3000'
const router = useRouter()
const auth = getAuth()

const socket = io(URL)

const usuarioActual = ref(null)
const usuarios = ref([])
const mensajes = ref([])
const mensajesPrivados = ref([])
const texto = ref('')
const escribiendo = ref('')
const salas = ref([])
const salaActual = ref('general')
const usuarioPrivado = ref(null)
const subiendo = ref(false)

let timeoutEscribiendo = null

const user = auth.currentUser
usuarioActual.value = {
  uid: user.uid,
  nombre: user.displayName || user.email,
  foto: user.photoURL || null,
}

socket.emit('usuario:entrar', usuarioActual.value)

socket.on('usuarios:lista', (lista) => {
  usuarios.value = lista
})

socket.on('salas:lista', (lista) => {
  salas.value = lista
})

socket.on('usuario:conectado', (usuario) => {
  usuarios.value.push(usuario)
})

socket.on('usuario:desconectado', ({ uid }) => {
  usuarios.value = usuarios.value.filter(u => u.uid !== uid)
  if (usuarioPrivado.value?.uid === uid) {
    usuarioPrivado.value = null
    mensajesPrivados.value = []
  }
})

socket.on('chat:mensaje', (mensaje) => {
  mensajes.value.push(mensaje)
})

socket.on('chat:sistema', (texto) => {
  mensajes.value.push({ sistema: true, texto })
})

socket.on('chat:escribiendo', ({ nombre, estaEscribiendo }) => {
  escribiendo.value = estaEscribiendo ? `${nombre} está escribiendo...` : ''
})

socket.on('privado:mensaje', (mensaje) => {
  mensajesPrivados.value.push(mensaje)
})

socket.on('privado:escribiendo', ({ nombre, estaEscribiendo }) => {
  escribiendo.value = estaEscribiendo ? `${nombre} está escribiendo...` : ''
})

function entrarSala(sala) {
  usuarioPrivado.value = null
  mensajesPrivados.value = []
  if (salaActual.value !== 'general') {
    socket.emit('sala:salir', salaActual.value)
  }
  salaActual.value = sala
  mensajes.value = []
  escribiendo.value = ''
  socket.emit('sala:entrar', sala)
}

function volverGeneral() {
  usuarioPrivado.value = null
  mensajesPrivados.value = []
  if (salaActual.value !== 'general') {
    socket.emit('sala:salir', salaActual.value)
  }
  salaActual.value = 'general'
  mensajes.value = []
  escribiendo.value = ''
}

function abrirPrivado(usuario) {
  usuarioPrivado.value = usuario
  mensajesPrivados.value = []
  escribiendo.value = ''
}

function alEscribir() {
  if (usuarioPrivado.value) {
    socket.emit('privado:escribiendo', { estaEscribiendo: true, destinatarioUid: usuarioPrivado.value.uid })
    clearTimeout(timeoutEscribiendo)
    timeoutEscribiendo = setTimeout(() => {
      socket.emit('privado:escribiendo', { estaEscribiendo: false, destinatarioUid: usuarioPrivado.value.uid })
    }, 3000)
  } else {
    socket.emit('chat:escribiendo', { estaEscribiendo: true, sala: salaActual.value })
    clearTimeout(timeoutEscribiendo)
    timeoutEscribiendo = setTimeout(() => {
      socket.emit('chat:escribiendo', { estaEscribiendo: false, sala: salaActual.value })
    }, 3000)
  }
}

function enviarMensaje() {
  if (usuarioPrivado.value) {
    socket.emit('privado:mensaje', {
      texto: texto.value.trim(),
      destinatarioUid: usuarioPrivado.value.uid
    })
    socket.emit('privado:escribiendo', { estaEscribiendo: false, destinatarioUid: usuarioPrivado.value.uid })
  } else {
    socket.emit('chat:mensaje', { texto: texto.value.trim(), sala: salaActual.value })
    socket.emit('chat:escribiendo', { estaEscribiendo: false, sala: salaActual.value })
  }

  clearTimeout(timeoutEscribiendo)
  texto.value = ''
}

async function seleccionarArchivo(e) {
  const archivo = e.target.files[0]
  if (!archivo) return

  subiendo.value = true

  const nombreLimpio = archivo.name.replace(/\s+/g, '_').replace(/[()]/g, '')

  const { error } = await supabase.storage.from('imagenes').upload(nombreLimpio, archivo)
  if (error) {
    console.log('Error al subir:', error)
    subiendo.value = false
    return
  }

  const { data } = await supabase.storage.from('imagenes').getPublicUrl(nombreLimpio)

  const archivoData = {
    url: data.publicUrl,
    nombre: archivo.name,
    tipo: archivo.type,
  }

  if (usuarioPrivado.value) {
    socket.emit('privado:mensaje', {
      texto: '',
      destinatarioUid: usuarioPrivado.value.uid,
      archivo: archivoData
    })
  } else {
    socket.emit('chat:mensaje', {
      texto: '',
      sala: salaActual.value,
      archivo: archivoData
    })
  }

  subiendo.value = false
  e.target.value = ''
}

function esImagen(tipo) {
  return tipo?.startsWith('image/')
}

function cerrarSesion() {
  socket.disconnect()
  signOut(auth).then(() => router.push('/'))
}

const mensajesActivos = () => usuarioPrivado.value ? mensajesPrivados.value : mensajes.value
</script>

<template>
  <div class="wa-layout">

    <aside class="wa-sidebar">
      <div class="wa-sidebar__header">
        <img :src="usuarioActual?.foto" class="wa-avatar" />
        <span>{{ usuarioActual?.nombre }}</span>
        <button @click="cerrarSesion">Salir</button>
      </div>

      <div class="wa-sidebar__seccion">General</div>
      <ul class="wa-lista-usuarios">
        <li
          class="wa-usuario"
          :class="{ 'wa-usuario--activo': salaActual === 'general' && !usuarioPrivado }"
          @click="volverGeneral"
        >
          <div class="wa-sala-icono">💬</div>
          <span>Chat general</span>
        </li>
      </ul>

      <div class="wa-sidebar__seccion">Salas</div>
      <ul class="wa-lista-usuarios">
        <li
          v-for="sala in salas"
          :key="sala"
          class="wa-usuario"
          :class="{ 'wa-usuario--activo': sala === salaActual && !usuarioPrivado }"
          @click="entrarSala(sala)"
        >
          <div class="wa-sala-icono">#</div>
          <span>{{ sala }}</span>
        </li>
      </ul>

      <div class="wa-sidebar__seccion">Usuarios conectados</div>
      <ul class="wa-lista-usuarios">
        <li
          v-for="u in usuarios"
          :key="u.socketId"
          class="wa-usuario"
          :class="{ 'wa-usuario--activo': usuarioPrivado?.uid === u.uid }"
          @click="abrirPrivado(u)"
        >
          <img :src="u.foto" class="wa-avatar" />
          <span>{{ u.nombre }}</span>
          <span v-if="u.uid === usuarioActual?.uid" class="wa-tu">tú</span>
        </li>
      </ul>
    </aside>

    <main class="wa-chat">
      <div class="wa-chat__header">
        <span v-if="usuarioPrivado">🔒 {{ usuarioPrivado.nombre }}</span>
        <span v-else-if="salaActual === 'general'">💬 Chat general</span>
        <span v-else># {{ salaActual }}</span>
      </div>

      <div class="wa-mensajes">
        <template v-for="(msg, i) in mensajesActivos()" :key="i">
          <div v-if="msg.sistema" class="wa-msg-sistema">{{ msg.texto }}</div>
          <div v-else class="wa-msg" :class="msg.nombre === usuarioActual?.nombre ? 'wa-msg--propio' : 'wa-msg--ajeno'">
            <img :src="msg.foto" class="wa-avatar wa-avatar--xs" />
            <div class="wa-msg__burbuja">
              <span class="wa-msg__nombre">{{ msg.nombre }}</span>

              <p v-if="msg.texto">{{ msg.texto }}</p>

              <div v-else-if="msg.archivo && esImagen(msg.archivo.tipo)" class="wa-archivo-img">
                <img :src="msg.archivo.url" :alt="msg.archivo.nombre" class="wa-img-mensaje" />
                <a :href="`${msg.archivo.url}?download=`" download class="wa-descarga">⬇ Descargar</a>
              </div>

              <div v-else-if="msg.archivo" class="wa-archivo">
                <span>📄 {{ msg.archivo.nombre }}</span>
                <a :href="`${msg.archivo.url}?download=`" download class="wa-descarga">⬇ Descargar</a>
              </div>
              
              <span class="wa-hora">{{ msg.timestamp }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="wa-escribiendo">{{ escribiendo }}</div>

      <div class="wa-chat__footer">
        <label class="wa-adjunto" :class="{ 'wa-adjunto--cargando': subiendo }">
          {{ subiendo ? '⏳' : '📎' }}
          <input type="file" @change="seleccionarArchivo" style="display:none" />
        </label>
        <input
          v-model="texto"
          placeholder="Escribe un mensaje..."
          @keydown.enter="enviarMensaje"
          @input="alEscribir"
        />
        <button @click="enviarMensaje">Enviar</button>
      </div>
    </main>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.wa-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #111b21;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  color: #e9edef;
  overflow: hidden;
}

.wa-sidebar {
  width: 360px;
  min-width: 280px;
  background: #202c33;
  border-right: 1px solid #2a3942;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wa-sidebar__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #202c33;
  border-bottom: 1px solid #2a3942;
}

.wa-sidebar__header span {
  flex: 1;
  font-weight: 600;
  font-size: 15px;
}

.wa-sidebar__header button {
  background: none;
  border: none;
  color: #8696a0;
  cursor: pointer;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}

.wa-sidebar__header button:hover {
  background: #2a3942;
  color: #e9edef;
}

.wa-sidebar__seccion {
  padding: 8px 16px;
  font-size: 12px;
  color: #8696a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #2a3942;
}

.wa-lista-usuarios {
  list-style: none;
  overflow-y: auto;
}

.wa-lista-usuarios::-webkit-scrollbar { width: 4px; }
.wa-lista-usuarios::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 2px; }

.wa-usuario {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #2a3942;
  cursor: pointer;
  transition: background 0.15s;
}

.wa-usuario:hover { background: #2a3942; }

.wa-usuario--activo {
  background: #2a3942;
  border-left: 3px solid #00a884;
}

.wa-usuario span {
  font-size: 15px;
  color: #e9edef;
}

.wa-tu {
  font-size: 11px !important;
  color: #8696a0 !important;
  margin-left: auto;
}

.wa-sala-icono {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2a3942;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #00a884;
  flex-shrink: 0;
}

.wa-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0b141a;
  overflow: hidden;
}

.wa-chat__header {
  padding: 12px 20px;
  background: #202c33;
  border-bottom: 1px solid #2a3942;
  font-size: 16px;
  font-weight: 600;
}

.wa-mensajes {
  flex: 1;
  overflow-y: auto;
  padding: 16px 60px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wa-mensajes::-webkit-scrollbar { width: 6px; }
.wa-mensajes::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 3px; }

.wa-msg-sistema {
  text-align: center;
  margin: 8px 0;
  font-size: 12px;
  color: #8696a0;
  background: rgba(17,27,33,0.8);
  padding: 4px 14px;
  border-radius: 8px;
  align-self: center;
}

.wa-msg {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 65%;
}

.wa-msg--propio {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.wa-msg--ajeno {
  align-self: flex-start;
}

.wa-msg__burbuja {
  padding: 7px 10px 6px;
  border-radius: 8px;
  max-width: 100%;
}

.wa-msg--ajeno .wa-msg__burbuja {
  background: #202c33;
  border-top-left-radius: 0;
}

.wa-msg--propio .wa-msg__burbuja {
  background: #005c4b;
  border-top-right-radius: 0;
}

.wa-msg__nombre {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #00a884;
  margin-bottom: 2px;
}

.wa-msg__burbuja p {
  font-size: 14px;
  color: #e9edef;
  word-break: break-word;
  line-height: 1.45;
}

.wa-img-mensaje {
  max-width: 240px;
  max-height: 200px;
  border-radius: 6px;
  display: block;
}

.wa-archivo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #e9edef;
}

.wa-archivo-img {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wa-descarga {
  font-size: 12px;
  color: #00a884;
  text-decoration: none;
}

.wa-descarga:hover {
  text-decoration: underline;
}

.wa-escribiendo {
  height: 24px;
  padding: 0 20px;
  font-size: 12px;
  color: #00a884;
}

.wa-chat__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #202c33;
}

.wa-adjunto {
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.wa-adjunto:hover { background: #2a3942; }

.wa-adjunto--cargando {
  opacity: 0.5;
  pointer-events: none;
}

.wa-chat__footer input {
  flex: 1;
  background: #2a3942;
  border: none;
  border-radius: 24px;
  padding: 10px 18px;
  color: #e9edef;
  font-size: 15px;
  outline: none;
}

.wa-chat__footer input::placeholder {
  color: #8696a0;
}

.wa-chat__footer button {
  background: #00a884;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.wa-chat__footer button:hover {
  background: #008069;
}

.wa-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.wa-avatar--xs {
  width: 28px;
  height: 28px;
}
</style>