import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { VueFire } from 'vuefire'
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyBAUrooHfovwnPzRr0Wep7lTxaWKNJfD4w",
  authDomain: "whatsapp-clone-a5100.firebaseapp.com",
  projectId: "whatsapp-clone-a5100",
  storageBucket: "whatsapp-clone-a5100.firebasestorage.app",
  messagingSenderId: "832095029146",
  appId: "1:832095029146:web:596fa3f7c25f3a1b9d1c23"
};

const firebaseApp = initializeApp(firebaseConfig);

const app = createApp(App)

app.use(router)

app.use(VueFire,{
    firebaseApp,
    modules:[],
});

app.mount('#app')