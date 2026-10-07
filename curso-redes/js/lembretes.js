/* Lembretes das horas de estudo.
   - Notificações do sistema (Notification API / service worker) às horas escolhidas, nos dias de
     estudo do plano. Funcionam com a app aberta ou em segundo plano; com a app totalmente fechada
     o navegador não acorda a página, por isso há também:
   - Lembretes no calendário do telemóvel (ficheiro .ics com alarmes), que tocam sempre. */
(function () {
  "use strict";
  const temNotif = typeof window.Notification !== "undefined";
  const pad = (n) => String(n).padStart(2, "0");
  const DIAS_ICS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  function estado() {
    if (!temNotif) return "sem-suporte";
    return Notification.permission; // "default" | "granted" | "denied"
  }
  function pedirPermissao() {
    if (!temNotif) return Promise.resolve("sem-suporte");
    try { const r = Notification.requestPermission(); return r && r.then ? r.catch(() => Notification.permission) : Promise.resolve(Notification.permission); }
    catch (e) { return Promise.resolve("denied"); }
  }
  function mostrar(titulo, corpo) {
    if (estado() !== "granted") return Promise.resolve(false);
    const op = { body: corpo, icon: "icons/icon-192.png", badge: "icons/icon-64.png", tag: "ccna-estudo", renotify: true, vibrate: [120, 60, 120], data: { url: "./#inicio" } };
    const sw = navigator.serviceWorker;
    const porSw = sw && sw.getRegistration ? sw.getRegistration().then((r) => (r && r.showNotification ? r.showNotification(titulo, op).then(() => true) : null)).catch(() => null) : Promise.resolve(null);
    return porSw.then((ok) => { if (ok) return true; try { new Notification(titulo, op); return true; } catch (e) { return false; } });
  }

  // Verifica de 20 em 20 segundos se chegou uma hora de estudo de hoje que ainda não foi avisada.
  let relogio = null;
  function iniciar(obterCfg, obterTexto, aoAvisar) {
    clearInterval(relogio);
    const verificar = () => {
      const c = obterCfg(); if (!c || !c.on || !c.horas || !c.horas.length) return;
      const agora = new Date(), hoje = agora.toISOString().slice(0, 10);
      if (!c.dias.includes(agora.getDay())) return;
      c.feitos = c.feitos || {};
      c.horas.forEach((h, k) => {
        const [hh, mm] = h.split(":").map(Number), alvo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hh, mm);
        const atraso = agora - alvo, chave = hoje + "|" + k;
        if (atraso < 0 || atraso > 15 * 60000 || c.feitos[chave]) return; // até 15 min depois da hora
        c.feitos[chave] = Date.now();
        const t = obterTexto(k);
        mostrar(t.titulo, t.corpo);
        if (aoAvisar) aoAvisar(t, k);
      });
      Object.keys(c.feitos).forEach((x) => { if (!x.startsWith(hoje)) delete c.feitos[x]; });
    };
    verificar();
    relogio = setInterval(verificar, 20000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") verificar(); });
  }

  // Calendário: um evento semanal por sessão, com alarme à hora de início
  function ics(c, nomes, minutos, fim) {
    const agora = new Date(), carimbo = agora.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const ate = fim ? `;UNTIL=${fim.getFullYear()}${pad(fim.getMonth() + 1)}${pad(fim.getDate())}T235959Z` : "";
    const dias = c.dias.map((d) => DIAS_ICS[d]).join(",");
    const ev = c.horas.map((h, k) => {
      const [hh, mm] = h.split(":").map(Number), d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const ini = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`;
      return ["BEGIN:VEVENT", `UID:ccna-estudo-${k}-${carimbo}@redes`, `DTSTAMP:${carimbo}`, `DTSTART:${ini}`, `DURATION:PT${Math.max(5, Math.round(minutos[k] || 30))}M`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dias}${ate}`, `SUMMARY:Estudar redes (${nomes[k] || "Sessão"})`, "DESCRIPTION:Abra a app Curso de Redes de Computadores e faça as aulas de hoje.",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Hora de estudar redes", "TRIGGER:PT0M", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Daqui a 10 minutos: estudo de redes", "TRIGGER:-PT10M", "END:VALARM", "END:VEVENT"].join("\r\n");
    });
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Curso de Redes de Computadores//PT", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
  }
  function descarregarIcs(texto) {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([texto], { type: "text/calendar" }));
      a.download = "horas-de-estudo.ics"; document.body.appendChild(a); a.click(); a.remove();
      return true;
    } catch (e) { return false; }
  }

  window.Lembretes = { estado, pedirPermissao, mostrar, iniciar, ics, descarregarIcs, temNotif };
})();
