// Miss Express — script.js
(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var sections = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  } else {
    sections.forEach(function (section) {
      section.classList.add('visible');
    });
  }

  var installTip = document.getElementById('installTip');
  window.addEventListener('beforeinstallprompt', function () {
    if (installTip) {
      installTip.hidden = false;
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (error) {
        console.error('Error registrando Service Worker:', error);
      });
    });
  }
})();
