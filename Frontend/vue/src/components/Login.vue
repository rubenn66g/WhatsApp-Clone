<script setup>
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { ref } from "vue";
import { collection, getFirestore, query, where } from "firebase/firestore";
import { GithubAuthProvider } from "firebase/auth";
import { useCollection } from "vuefire";
import router from '../router/index';

const auth = getAuth();
const providerGoogle = new GoogleAuthProvider();
const providerGit = new GithubAuthProvider();

var nombreUsuario = ref("");
var imgUsuario = ref("");
var logueado = ref(false);
var registrar = ref(false);
var correo = ref("");
var contrasena = ref("");
var olvidadoContrasena = ref(false);
var idUsuario;
var recuerdos = ref([]);


function iniciaSesionGoogle() {
  signInWithPopup(auth, providerGoogle)
    .then((result) => {
      const user = result.user;
      logueado.value = true;
      nombreUsuario.value = user.displayName;
      imgUsuario.value = user.photoURL;
      idUsuario = user.uid;
      router.push("/avatar");
    }).catch((error) => {
      console.log(error.message);
    });
}

function iniciaSesionGit() {
  signInWithPopup(auth, providerGit)
    .then((result) => {
      const user = result.user;
      logueado.value = true;
      nombreUsuario.value = user.displayName;
      imgUsuario.value = user.photoURL;
      idUsuario = user.uid;
      router.push("/avatar");
    }).catch((error) => {
      console.log(error.message);
    });
}

function registrarse(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      registrar.value = false;
      router.push("/avatar");
    })
    .catch((error) => {
      alert(error.message);
    });
}

function iniciaSesionEmail(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      router.push("/avatar");
    })
    .catch((error) => {
      alert(error.message);
    });
}

function enviarCorreoContrasena(email) {
  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Correo enviado");
    })
    .catch((error) => {
      console.log(error.message);
    });
}

</script>

<template>
  <div class="form-card">

    <div v-if="olvidadoContrasena" class="input-grupal-vertical">
      <h1>Recuperar Contraseña</h1>
      <input v-model="correo" type="email" placeholder="Introduce tu Email">
      <button class="btn-principal" @click="enviarCorreoContrasena(correo)">Enviar correo</button>
      <button class="btn-secundario" @click="olvidadoContrasena = false">Volver</button>
    </div>

    <div v-else-if="registrar" class="input-grupal-vertical">
      <h1>Crear Cuenta</h1>
      <input v-model="correo" type="email" placeholder="Introduce tu Email">
      <input v-model="contrasena" type="password" placeholder="Crea una Contraseña">
      <button class="btn-principal" @click="registrarse(correo, contrasena)">Registrarse</button>
      <p>
        ¿Ya tienes cuenta?
        <a href="#" @click="registrar = false">Inicia Sesión</a>
      </p>
    </div>

    <div v-else class="input-grupal-vertical">
      <h1>Iniciar Sesión</h1>
      <input v-model="correo" type="email" placeholder="Email">
      <input v-model="contrasena" type="password" placeholder="Contraseña">
      <button class="btn-principal" @click="iniciaSesionEmail(correo, contrasena)">Entrar</button>
      <button @click="iniciaSesionGoogle">Iniciar sesión con Google</button>
      <button @click="iniciaSesionGit">Iniciar sesión con GitHub</button>
      <div class="enlaces-auxiliares">
        <a href="#" @click="olvidadoContrasena = true">Olvidé mi contraseña</a>
        <br>
        <span>¿No tienes cuenta? </span>
        <a href="#" @click="registrar = true">Regístrate aquí</a>
      </div>
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
  background-color: #111b21;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.form-card {
  background: #202c33;
  border-radius: 12px;
  padding: 40px 36px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-grupal-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  color: #e9edef;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

input {
  background: #2a3942;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  color: #e9edef;
  font-size: 15px;
  outline: none;
  width: 100%;
  transition: background 0.2s;
}

input::placeholder {
  color: #8696a0;
}

input:focus {
  background: #344955;
}

button {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-principal {
  background: #00a884;
  color: #fff;
}

.btn-principal:hover {
  background: #008069;
}

.btn-secundario {
  background: #2a3942;
  color: #e9edef;
}

.btn-secundario:hover {
  background: #344955;
}

button:not(.btn-principal):not(.btn-secundario) {
  background: #2a3942;
  color: #e9edef;
}

button:not(.btn-principal):not(.btn-secundario):hover {
  background: #344955;
}

p, span {
  color: #8696a0;
  font-size: 13px;
  text-align: center;
}

a {
  color: #00a884;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.enlaces-auxiliares {
  text-align: center;
  font-size: 13px;
  color: #8696a0;
}
</style>