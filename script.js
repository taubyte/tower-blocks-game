// Initialize year
document.getElementById('year').textContent = new Date().getFullYear();

// Initialize Plyr for the how-to section
try {
  const player = new Plyr('#howto-player', {
    controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'],
    settings: ['quality', 'speed'],
    youtube: { rel: 0, modestbranding: 1, hl: 'en', playsinline: 1 },
  });
  // Suggest higher quality when possible
  if (player && typeof player.quality !== 'undefined') {
    try { player.quality = 1080; } catch (_) {}
  }
} catch (e) {
  // no-op if Plyr fails to load
}

// Leaderboard fetch
const leaderboardEl = document.getElementById('leaderboard-content');
(async function loadLeaderboard() {
  const endpoint = 'https://9uaqltej2.g.k8s.cyou/api/leaderboard';
  try {
    const cached = getCached('leaderboard');
    if (cached) renderLeaderboard(cached);
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.scores || []);
    setCached('leaderboard', list, 60);
    renderLeaderboard(list);
  } catch (err) {
    if (!leaderboardEl.innerHTML.trim()) {
      leaderboardEl.innerHTML = `<div class="error">Could not load scores. Please try again later.</div>`;
    }
    // console.error('Leaderboard fetch failed', err);
  }
})();

function renderLeaderboard(scores) {
  if (!scores || scores.length === 0) {
    leaderboardEl.innerHTML = `<div class="loading">No scores yet.</div>`;
    return;
  }
  // Map to the provided API shape and sort desc by score
  const normalized = scores.map(s => ({
    name: s.player_name || s.name || s.player || 'Player',
    score: Number(s.highest_score ?? s.score ?? s.points ?? 0)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);
  leaderboardEl.innerHTML = normalized
    .map((s, idx) => {
      const name = (s.name || 'Player').toString().slice(0, 20);
      const score = (s.score ?? 0);
      const rankClass = idx === 0 ? 'badge-1' : idx === 1 ? 'badge-2' : idx === 2 ? 'badge-3' : '';
      return `
        <div class="row">
          <div class="cell badge"><span class="rank ${rankClass}">#${idx + 1}</span> ${escapeHtml(name)}</div>
          <div class="cell" style="text-align:right;">${escapeHtml(String(score))}</div>
        </div>`;
    })
    .join('');
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// (removed) Ladder logic

// Modal: full leaderboard
const modal = document.getElementById('board-modal');
const modalBody = document.querySelector('#modal-body .board');
function openModal() { modal.classList.add('show'); }
function closeModal() { modal.classList.remove('show'); }
document.getElementById('view-full-board').addEventListener('click', async () => {
  openModal();
  const res = await fetch('https://9uaqltej2.g.k8s.cyou/api/leaderboard');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data?.scores || []);
  const normalized = list.map(s => ({ name: s.player_name || s.name || 'Player', score: Number(s.highest_score ?? s.score ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
  modalBody.innerHTML = normalized.map((s, idx) => `
    <div class="row">
      <div class="cell">#${idx + 1} · ${escapeHtml(s.name)}</div>
      <div class="cell" style="text-align:right;">${escapeHtml(String(s.score))}</div>
    </div>
  `).join('');
});
document.querySelectorAll('[data-close="modal"]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Refresh and caching helpers
document.getElementById('refresh-board').addEventListener('click', () => {
  clearCached('leaderboard');
  leaderboardEl.innerHTML = '<div class="loading">Refreshing…</div>';
  // Re-run fetch
  (async () => {
    try {
      const res = await fetch('https://9uaqltej2.g.k8s.cyou/api/leaderboard');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.scores || []);
      setCached('leaderboard', list, 60);
      renderLeaderboard(list);
    } catch (e) {
      leaderboardEl.innerHTML = '<div class="error">Could not refresh. Try again later.</div>';
    }
  })();
});

function setCached(key, value, ttlSeconds) {
  try { localStorage.setItem(key, JSON.stringify({ value, expires: Date.now() + ttlSeconds * 1000 })); } catch (_) {}
}
function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expires < Date.now()) { localStorage.removeItem(key); return null; }
    return parsed.value;
  } catch (_) { return null; }
}
function clearCached(key) { try { localStorage.removeItem(key); } catch (_) {} }

// FAB menu toggle
(() => {
  const btn = document.getElementById('fab-toggle');
  const menu = document.getElementById('fab-menu');
  if (!btn || !menu) return;
  const close = () => { menu.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = '▲'; };
  const open = () => { menu.classList.add('show'); btn.setAttribute('aria-expanded', 'true'); btn.textContent = '✕'; };
  btn.addEventListener('click', () => {
    const isOpen = menu.classList.contains('show');
    if (isOpen) close(); else open();
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== btn) close();
  });
})();

// Scroll reveal
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

// Ripple on Play button
(() => {
  const button = document.querySelector('.ripple-container');
  if (!button) return;
  button.addEventListener('click', (e) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
})();


