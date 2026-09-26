import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  get, 
  update, 
  remove, 
  onValue, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

// إعدادات Firebase العامة للواجهة (آمنة تماماً عند حمايتها عبر Security Rules)
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey_ReplaceWithYourActualProjectApiKey",
  authDomain: "anwar-taiba.firebaseapp.com",
  databaseURL: "https://anwar-taiba-default-rtdb.firebaseio.com",
  projectId: "anwar-taiba",
  storageBucket: "anwar-taiba.appspot.com",
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, push, get, update, remove, onValue, serverTimestamp };