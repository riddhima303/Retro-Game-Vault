const API_KEY = "807d4e3fecd8428baf75c42cb2f8effc";

const container = document.getElementById("games");
const loading = document.getElementById("loading");

async function fetchGames() {
  loading.style.display = "block";

  try {
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
  } catch (error) {
    container.innerHTML = "<p>Unable to load games. Please try again later.</p>";
  } finally {
    loading.style.display = "none";
  }
}

fetchGames();