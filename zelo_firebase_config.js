// Configuração central do Firebase do ZELO.
// Antes estava copiada, byte a byte, em mais de 25 ficheiros — se um dia for
// preciso mudar algum valor (rotação de chave, novo projeto, etc.), bastava
// esquecer um ficheiro para ficar com uma cópia desatualizada sem ninguém dar
// por isso. Agora só existe aqui; cada página importa esta constante.
export const firebaseConfig = {
  apiKey: "AIzaSyB72sUTmo7x1gOiNQfn112Na2MvX82kZ4E",
  authDomain: "hospital-do-prenda-1de35.firebaseapp.com",
  databaseURL: "https://hospital-do-prenda-1de35-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hospital-do-prenda-1de35",
  storageBucket: "hospital-do-prenda-1de35.firebasestorage.app",
  messagingSenderId: "991683012968",
  appId: "1:991683012968:web:f86ae42cd1cbe8bc71cedd"
};
