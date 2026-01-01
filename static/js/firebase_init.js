// Firebase Client SDK Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AQ.Ab8RN6LVX5FVd_j0PN8i4XUQW4Fi6Wbtx50aTLj9AtecttKEzQ",
    authDomain: "bonniface-cd57a.firebaseapp.com",
    databaseURL: "https://bonniface-cd57a-default-rtdb.firebaseio.com",
    projectId: "bonniface-cd57a",
    storageBucket: "bonniface-cd57a.firebasestorage.app",
    messagingSenderId: "550614051141",
    appId: "1:550614051141:web:4af5653b4831c5200a362c",
    measurementId: "G-30F6SYSFWV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("Firebase Analytics Initialized");
