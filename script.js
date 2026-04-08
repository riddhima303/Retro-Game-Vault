const API_KEY = "807d4e3fecd8428baf75c42cb2f8effc";

const container = document.getElementById("games");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");
const sortSelect = document.getElementById("sort");
const themeToggle = document.getElementById("themeToggle");
const loadedCountEl = document.getElementById("loadedCount");
const likedCountEl = document.getElementById("likedCount");
const genreCountEl = document.getElementById("genreCount");
const sidebarNav = document.getElementById("sidebarNav");

let allGames = [];
let liked = new Set();
let activeSidebar = "featured";

// Load theme from localStorage
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "◑ dark";
  } else if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "◐ light";
  }
}

// 🎮 Fetch Games
async function fetchGames() {
  loading.style.display = "block";
  container.innerHTML = "";

  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}`);
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();

    allGames = data.results;
    applyAll();

  } catch (error) {
    container.innerHTML = "<p style='grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);'>unable to load games</p>";
  } finally {
    loading.style.display = "none";
  }
}

// 🖥 Render Games
function renderGames(games) {
  if (games.length === 0) {
    container.innerHTML = "<p style='grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);'>no games found</p>";
    updateSidebarCounts(0, liked.size);
    return;
  }

  const output = games
    .map(game => {
      const isLiked = liked.has(game.id);
      const genreNames = game.genres && game.genres.length 
        ? game.genres.map(g => g.name).join(", ") 
        : "—";
      
      const releaseYear = game.released ? new Date(game.released).getFullYear() : "—";
      const rating = game.rating ? game.rating.toFixed(1) : "—";
      const platformCount = game.platforms ? game.platforms.length : 0;

      return `
        <div class="game-card">
          <div class="card-image">
            <img src="${game.background_image || 'https://via.placeholder.com/400x300/f5f5f5/cccccc?text=no+image'}" alt="${game.name}" loading="lazy"/>
            ${rating !== "—" ? `<div class="card-overlay">${rating} ★</div>` : ""}
          </div>
          <div class="card-content">
            <div class="card-header">
              <h3 class="card-title">${game.name}</h3>
              ${rating !== "—" ? `<div class="card-rating">${rating}</div>` : ""}
            </div>
            <div class="card-meta">
              <span class="card-meta-item">
                <span>📅</span> ${releaseYear}
              </span>
              ${platformCount > 0 ? `<span class="card-meta-item"><span>🎮</span> ${platformCount}</span>` : ""}
            </div>
            <p class="card-genres">${genreNames}</p>
            <div class="card-actions">
              <button class="btn btn-primary" onclick="window.viewMore('${game.name}')">view</button>
              <button class="btn btn-icon ${isLiked ? 'liked' : ''}" onclick="window.toggleLike(${game.id})" title="like">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = output;
  updateSidebarCounts(games.length, liked.size, getUniqueGenres(allGames));
}

function updateSidebarCounts(total, likes, genreCount) {
  if (loadedCountEl) loadedCountEl.textContent = total;
  if (likedCountEl) likedCountEl.textContent = likes;
  if (genreCountEl) genreCountEl.textContent = genreCount;
}

function getUniqueGenres(games) {
  const genres = new Set();
  if (!Array.isArray(games)) return 0;
  games.forEach(game => {
    if (game.genres) {
      game.genres.forEach(genre => genres.add(genre.name));
    }
  });
  return genres.size;
}

// 🔍 SEARCH + FILTER + SORT
function applyAll() {
  let result = allGames;

  // 🔍 Search
  const text = searchInput.value.toLowerCase();
  if (text) {
    result = result.filter(game =>
      game.name.toLowerCase().includes(text)
    );
  }

  // 🎯 Filter
  const genre = filterSelect.value.toLowerCase();
  if (genre !== "all") {
    result = result.filter(game =>
      game.genres && game.genres.some(g => g.slug.includes(genre))
    );
  }

  // 🌟 Sidebar actions
  if (activeSidebar === "favorites") {
    result = result.filter(game => liked.has(game.id));
  } else if (activeSidebar === "recommended") {
    result = result
      .filter(game => game.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  // 🔃 Sort
  const sortType = sortSelect.value;
  if (sortType === "name-asc") {
    result = [...result].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } else if (sortType === "name-desc") {
    result = [...result].sort((a, b) =>
      b.name.localeCompare(a.name)
    );
  } else if (sortType === "default" && activeSidebar === "featured") {
    result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortType === "default" && activeSidebar === "recent") {
    result = [...result].sort((a, b) => {
      const aDate = a.released ? new Date(a.released).getTime() : 0;
      const bDate = b.released ? new Date(b.released).getTime() : 0;
      return bDate - aDate;
    });
  }

  renderGames(result);
}

// ❤️ Like button
window.toggleLike = function(id) {
  if (liked.has(id)) {
    liked.delete(id);
  } else {
    liked.add(id);
  }
  applyAll();
  updateSidebarCounts(getVisibleCount(), liked.size, getUniqueGenres(allGames));
}

function getVisibleCount() {
  const text = searchInput.value.toLowerCase();
  let result = allGames;

  if (text) {
    result = result.filter(game =>
      game.name.toLowerCase().includes(text)
    );
  }

  const genre = filterSelect.value.toLowerCase();
  if (genre !== "all") {
    result = result.filter(game =>
      game.genres && game.genres.some(g => g.slug.includes(genre))
    );
  }

  if (activeSidebar === "favorites") {
    result = result.filter(game => liked.has(game.id));
  }

  return result.length;
}

// 👁 View button
window.viewMore = function(name) {
  alert(`viewing: ${name}`);
}

// 🌙 Theme Toggle
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  const isLight = document.body.classList.contains("light");
  
  document.body.classList.remove("dark", "light");
  
  if (!isDark && !isLight) {
    // Default to dark
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "◐ light";
  } else if (isDark) {
    // Dark -> Light
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "◑ dark";
  } else {
    // Light -> Default (remove classes)
    localStorage.setItem("theme", "default");
    themeToggle.textContent = "◐ light";
  }
});

// 🎧 Events
searchInput.addEventListener("input", applyAll);
filterSelect.addEventListener("change", applyAll);
sortSelect.addEventListener("change", applyAll);

if (sidebarNav) {
  sidebarNav.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    sidebarNav.querySelectorAll(".sidebar-link").forEach(link => link.classList.remove("active"));
    button.classList.add("active");
    activeSidebar = button.dataset.action;
    applyAll();
  });
}

// 🚀 Initialize
loadTheme();
fetchGames();