const API_KEY = "65c728e160e040f098e2e9657d53b3fa";

const container = document.getElementById("games");
const loading = document.getElementById("loading");

async function fetchGames() {
  loading.style.display = "block";
  const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}`);
  const data = await res.json();

  let output = "";

  data.results.forEach(game => {
    output += `
      <div>
        <h3>${game.name}</h3>
        <img src="${game.background_image}" width="200"/>
      </div>
    `;
  });
  container.innerHTML = output;
}

fetchGames();