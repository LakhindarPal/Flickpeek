// Constants
const apiKey = "1ad09aa71ec71309dd38680c95dc12fe";
const baseUrl = "https://api.themoviedb.org/3";

// get elements 
const mainElement = document.getElementById("main");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const nowPlayingBtn = document.getElementById("now-playing");
const trendingSelect = document.getElementById("trending");
const genreSelect = document.getElementById("genre");
const popularBtn = document.getElementById("popular");
const topRatedBtn = document.getElementById("top-rated");
const upcomingBtn = document.getElementById("upcoming");

// helper function to create elements
function createElement(tag, attributes = {}, content = "") {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  element.innerHTML = content;
  return element;
}

// function to fetch movie data
async function fetchData(endpoint, dataId, query = "") {
  try {
    const storedData = JSON.parse(localStorage.getItem(dataId));
    const currentTime = new Date().getTime();

    // return storedData if applicable
    if (storedData) {
      const { timestamp, data } = storedData;
      const currentDay = new Date().getDate();
      const storedDay = new Date(timestamp).getDate();
      const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      if ((currentTime - timestamp < SIX_HOURS) && currentDay === storedDay) {
        return data;
      }
    }

    const apiUrl = `${baseUrl}${endpoint}?api_key=${apiKey}&language=en-US&page=1&include_adult=false${query}`;
    const response = await fetch(apiUrl).then(res => res.json());

    if (!response?.results?.length) return null;

    const newData = response.results.map(item => ({
      id: item.id,
      title: item.title,
      poster_path: item.poster_path,
      release_date: item.release_date,
      vote_average: item.vote_average
    }));

    if (dataId) {
      localStorage.setItem(dataId, JSON.stringify({ data: newData, timestamp: currentTime }));
    }

    return newData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

// function to display movie details 
function displayMovies(results, heading) {
  const container = createElement("section", { class: "container" });

  results.forEach(movie => {
    const movieElement = createElement("article", { class: "movie" });
    const imgElement = createElement("img", { src: `https://image.tmdb.org/t/p/original${movie.poster_path}`, alt: movie.title, loading: "lazy" });
    movieElement.appendChild(imgElement);

    const titleElement = createElement("h3", { class: "title" }, movie.title);
    movieElement.appendChild(titleElement);
    const detailsElement = createElement("div", { class: "details" },
      `<p>${movie.release_date}</p>
      <p>⭐ ${movie.vote_average.toFixed(2)} / 10</p>`
    );
    movieElement.appendChild(detailsElement);

    movieElement.addEventListener("click", () => showMovieDetails(movie.id));
    container.appendChild(movieElement);
  });

  mainElement.innerHTML = `<h2>${heading}</h2>`;
  mainElement.appendChild(container)
}

// show movie details in a dialog
async function showMovieDetails(movieId) {
  try {
    const movie = await fetch(`${baseUrl}/movie/${movieId}?language=en-US&append_to_response=videos&api_key=${apiKey}`).then(res => res.json());

    const dialog = createElement("dialog");
    const article = createElement("article");
    const articleFragment = document.createDocumentFragment();

    // Create elements for movie details
    const titleEl = createElement("h2", { class: "title" }, movie.title);
    const taglineEl = createElement("p", { class: "tagline" }, movie.tagline);
    const overviewSection = createElement("section", { class: "overview" }, `<h3>Overview</h3><p>${movie.overview}</p>`);
    const detailsSection = createElement("section", { class: "details" }, `
      <h3>Details</h3>
      <p><strong>Release Date:</strong> ${movie.release_date}</p>
      <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
      <p><strong>Genres:</strong> ${movie.genres.map(genre => genre.name).join(", ")}</p>
      <p><strong>Rating:</strong> ${movie.vote_average.toFixed(2)} / 10 (${movie.vote_count} votes)</p>
      <p><strong>Popularity:</strong> ${movie.popularity}</p>
    `);
    const studiosSection = createElement("section", { class: "studios" }, `<h3>Studios</h3>`);
    const linksSection = createElement("section", { class: "links" }, `<h3>Links</h3>`);

    // create elements for studios logos
    const studiosLogos = movie.production_companies.map(company => {
      const logo = createElement("img", { src: `https://image.tmdb.org/t/p/original${company.logo_path}`, alt: company.name });
      studiosSection.appendChild(logo);
    });

    // find trailer video data
    const trailer = movie.videos?.results?.find(video => video.site === 'YouTube' && video.type === 'Trailer' && video.official === true);

    // create links for trailer, homepage and IMDB
    if (trailer) {
      const trailerLink = createElement("a", { href: `https://www.youtube.com/watch?v=${trailer.key}`, target: "_blank" }, "Trailer");
      linksSection.appendChild(trailerLink);
    }

    const homeLink = createElement("a", { href: movie.homepage, target: "_blank" }, "Home");
    const imdbLink = createElement("a", { href: `https://www.imdb.com/title/${movie.imdb_id}/`, target: "_blank" }, "IMDB");
    linksSection.appendChild(homeLink);
    linksSection.appendChild(imdbLink);

    // append elements to article and dialog
    articleFragment.appendChild(titleEl);
    articleFragment.appendChild(taglineEl);
    articleFragment.appendChild(overviewSection);
    articleFragment.appendChild(detailsSection);
    articleFragment.appendChild(studiosSection);
    articleFragment.appendChild(linksSection);

    article.appendChild(articleFragment);
    dialog.appendChild(article);

    // create dialog close button
    const closeBtn = createElement("button", {}, "Close");
    closeBtn.addEventListener("click", () => dialog.close());
    dialog.appendChild(closeBtn);

    // append dialog to body and show
    document.body.appendChild(dialog);
    dialog.showModal();
  } catch (error) {
    console.error("Error fetching movie details:", error);
  }
}

async function fetchAndDisplay(endpoint, { dataId, heading }, query = "") {
  const data = await fetchData(endpoint, dataId, query);

  if (!data) {
    return mainElement.innerHTML = `<h2>No data was found for: ${heading}</h2>`;
  }

  displayMovies(data, heading);
}


// function to fetch nowplaying movies
function fetchNowPlaying() {
  fetchAndDisplay("/movie/now_playing", { dataId: "nowplaying", heading: "Now Playing" });
}

// fetch nowplaying movies after DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  fetchNowPlaying();
});

nowPlayingBtn.addEventListener("click", () => {
  fetchNowPlaying();
})

// fetch genre selected movies
genreSelect.addEventListener("change", () => {
  const genreId = genreSelect.value;
  if (!genreId) return;

  fetchAndDisplay(`/genre/${genreId}/movies`, { heading: "Movies in Genre" });
});

// fetch trending movies
trendingSelect.addEventListener("change", () => {
  const trendId = trendingSelect.value;
  if (!trendId) return;
  const trendTitle = { day: "Today", week: "This Week" };

  fetchAndDisplay(`/trending/movie/${trendId}`, { dataId: `trending_${trendId}`, heading: `Trending ${trendTitle[trendId]}` });
});

// event listener for search button
searchBtn.addEventListener("click", () => {
  const query = searchInput.value?.trim();
  if (!query) return alert("Please enter a movie name first!")
  const endpoint = `/search/movie`;

  fetchAndDisplay(endpoint, { heading: `Search results for ${query}` }, `&query=${query}`);
});

// fetch popular movies 
popularBtn.addEventListener("click", () => {
  fetchAndDisplay("/movie/popular", { dataId: "popular", heading: "All Time Popular" });
})

// fetch top-rated movies 
topRatedBtn.addEventListener("click", () => {
  fetchAndDisplay("/movie/top_rated", { dataId: "toprated", heading: "Top Rated Movies" });
})

// fetch upcoming movies
upcomingBtn.addEventListener("click", () => {
  fetchAndDisplay("/movie/upcoming", { dataId: "upcoming", heading: "Upcoming movies" });
})