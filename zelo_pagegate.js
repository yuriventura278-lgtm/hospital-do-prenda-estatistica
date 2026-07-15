// ZELO — proteção de página com sessão Firebase real (substitui a verificação por sessionStorage)
import { auth, fetchUserProfile, onAuthStateChanged } from './zelo_auth.js';

var moduleKey = window.ZELO_MODULE || null;

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.replace('index.html');
    return;
  }
  var perfil = await fetchUserProfile(user.uid);
  if (!perfil || perfil.ativo === false) {
    window.location.replace('index.html');
    return;
  }
  sessionStorage.setItem('zeloRole', perfil.role || 'funcionario');
  sessionStorage.setItem('zeloNome', perfil.nome || user.email);
  sessionStorage.setItem('zeloEmail', user.email || '');
  sessionStorage.setItem('zeloPermissoes', JSON.stringify(perfil.permissoes || {}));
  if (moduleKey && perfil.role !== 'admin' && perfil.permissoes && perfil.permissoes[moduleKey] === false) {
    window.location.replace('index.html');
    return;
  }
  document.documentElement.style.visibility = 'visible';
});
