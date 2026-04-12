(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var deferredPrompt = null;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  function isInStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var note = document.getElementById("install-note");
    if (note) note.textContent = "Tocá para instalar directo, sin tienda de apps";
  });

  window.addEventListener("appinstalled", function () {
    var note = document.getElementById("install-note");
    if (note) note.textContent = "¡App instalada! Ya podés abrirla desde tu pantalla de inicio.";
    deferredPrompt = null;
  });

  window.triggerInstall = async function (e) {
    if (e) e.preventDefault();

    if (isInStandaloneMode()) {
      window.alert("¡Ya tenés la app instalada! Buscá el ícono de Miss Express en tu pantalla de inicio.");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      var choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") deferredPrompt = null;
    } else if (isIOS) {
      showIOSModal();
    } else {
      var sec = document.getElementById("instalar");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }
  };

  window.showIOSModal = function () {
    var modal = document.getElementById("ios-overlay");
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  };

  window.closeIOS = function () {
    var modal = document.getElementById("ios-overlay");
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  };

  window.toggleMenu = function () {
    var menu = document.getElementById("nav-menu");
    var btn = document.querySelector(".hamburger");
    if (!menu) return;

    var open = menu.classList.toggle("open");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  var STEPS = {
    android: [
      { t: "Abrí Chrome", d: "Entrá a app.missexpress.net usando Chrome en tu celular Android." },
      { t: "Tocá el menú (⋮)", d: "Presioná los tres puntos en la esquina superior derecha del navegador." },
      { t: 'Seleccioná "Instalar app"', d: "Aparece el diálogo de instalación. Tocá Instalar y listo." },
      { t: "¡App instalada!", d: "El ícono de Miss Express aparece en tu pantalla de inicio como cualquier otra app." }
    ],
    ios: [
      { t: "Abrí en Safari", d: "Entrá a app.missexpress.net usando Safari en tu iPhone o iPad." },
      { t: "Tocá el botón Compartir", d: "Es el ícono de flecha hacia arriba en la barra inferior de Safari." },
      { t: 'Seleccioná "Agregar a inicio"', d: "Confirmá tocando Agregar y aparece el nombre e ícono de Miss Express." },
      { t: "¡App instalada!", d: "El ícono aparece en tu pantalla de inicio igual que una app nativa." }
    ]
  };

  var tutOs = "android";
  var tutStep = 0;

  function tutRender() {
    var col = document.getElementById("tut-steps-col");
    if (!col) return;

    col.innerHTML = STEPS[tutOs].map(function (step, index) {
      var cls = index === tutStep ? "tstep on" : (index < tutStep ? "tstep done" : "tstep");
      return (
        '<div class="' + cls + '" onclick="tutGo(' + index + ')">' +
          '<div class="tstep-n">' + (index < tutStep ? "✓" : index + 1) + "</div>" +
          '<div class="tstep-body"><strong>' + step.t + "</strong><span>" + step.d + "</span></div>" +
        "</div>"
      );
    }).join("");

    var prev = document.getElementById("tut-prev");
    var next = document.getElementById("tut-next");
    if (prev) prev.disabled = tutStep === 0;
    if (next) next.disabled = tutStep === STEPS[tutOs].length - 1;
  }

  function tutFrame() {
    var prefix = tutOs === "android" ? "a" : "i";
    ["af1", "af2", "af3", "af4", "if1", "if2", "if3", "if4"].forEach(function (id) {
      var frame = document.getElementById(id);
      if (frame) frame.classList.remove("on");
    });

    var active = document.getElementById(prefix + "f" + (tutStep + 1));
    if (active) active.classList.add("on");
    tutRender();
  }

  window.tutGo = function (index) {
    tutStep = index;
    tutFrame();
  };

  window.tutNext = function () {
    if (tutStep < STEPS[tutOs].length - 1) {
      tutStep += 1;
      tutFrame();
    }
  };

  window.tutPrev = function () {
    if (tutStep > 0) {
      tutStep -= 1;
      tutFrame();
    }
  };

  window.tutOS = function (os) {
    tutOs = os;
    tutStep = 0;
    document.getElementById("tab-and").classList.toggle("on", os === "android");
    document.getElementById("tab-ios").classList.toggle("on", os === "ios");
    tutFrame();
  };

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add("vis");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".fi").forEach(function (el) {
    io.observe(el);
  });

  window.addEventListener("load", function () {
    document.querySelectorAll(".hero .fi").forEach(function (el) {
      el.classList.add("vis");
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (err) {
        console.error("SW error:", err);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#nav-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        var menu = document.getElementById("nav-menu");
        var btn = document.querySelector(".hamburger");
        if (menu && menu.classList.contains("open")) {
          menu.classList.remove("open");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });

    tutFrame();
  });
})();
