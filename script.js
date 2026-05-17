const API_KEY = "CG-EXAgPfFigPe2qiSZuytxLjuc";
const API_URL = `https://api.coingecko.com/api/v3`;
const API_SPARKLINE = `sparkline=true&price_change_percentage=1h,24h,7d`;

const coinList = document.getElementById("coin-lists");
const coinModal = document.getElementById("coin-modal");
const coinModalInner = document.getElementById("coin-modal-inner");
const filterCoins = document.getElementById("filter-coins");
const coinModalCloseBtn = document.getElementById("coin-modal-close-btn");
const currencyButton = document.querySelector(".currency-button");
let currency = localStorage.getItem("currency") ?? "usd";
const input = document.getElementById("search-coin");
let allCoins = [];
const cache = new Map();
let isSearching = false;
let currentCoins = [];
let sparklineChart;
let savedHeader;
let sortDirection = "desc";

currencyButton.addEventListener("click", () => {
  const searchTerm = input.value.toLowerCase().trim();
  currency === "eur" ? (currency = "usd") : (currency = "eur");
  buttonText();
  if (searchTerm.length >= 3) {
    searchCoins();
  } else {
    loadData();
  }
  localStorage.setItem("currency", currency);
});

function buttonText() {
  if (currency === "eur") {
    currencyButton.textContent = "USD";
  } else {
    currencyButton.textContent = "EUR";
  }
}

async function searchCoins() {
  const searchTerm = input.value.toLowerCase().trim();
  const API_SEARCH = `${API_URL}/search?query=${searchTerm}&per_page=10&page=1&`;
  const cacheKey = `${searchTerm}-${currency}`;

  try {
    if (searchTerm.length < 3) {
      renderCoins(allCoins);
      return;
    }
    if (cache.has(cacheKey)) {
      const cachedResult = cache.get(cacheKey);
      renderCoins(cachedResult);
      return;
    }
    if (isSearching) {
      return;
    }
    isSearching = true;
    const searchResponse = await fetch(API_SEARCH);
    if (!searchResponse.ok) {
      throw new Error(`Error: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    const newAllCoins = searchData.coins.slice(0, 10).map(myFunction);
    const marketData = await idSearch(newAllCoins);
    if (!marketData) {
      return;
    }
    cache.set(cacheKey, marketData);

    function myFunction(coin) {
      return coin.id;
    }
    renderCoins(marketData);
  } catch (error) {
    console.log(error);
  } finally {
    isSearching = false;
  }
}

async function idSearch(newAllCoins) {
  try {
    const joinedIds = newAllCoins.join();
    const API_ID = `${API_URL}/coins/markets?vs_currency=${currency}&ids=${joinedIds}&per_page=10&page=1&${API_SPARKLINE}`;

    const marketResponse = await fetch(API_ID);

    if (marketResponse.status === 429) {
      console.warn(
        "Rate limit exceeded. Please wait a moment before searching again.",
      );
      return null;
    }

    if (!marketResponse.ok) throw new Error(`Error: ${marketResponse.status}`);
    return await marketResponse.json();
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const debounceSearch = debounce(searchCoins, 1000);
input.addEventListener("input", debounceSearch);

async function getCoinsData() {
  const url = `${API_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d&${API_SPARKLINE}&x_cg_demo_api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

function renderCoins(coinsToRender) {
  currentCoins = coinsToRender;
  const visibleCoins = coinsToRender.slice(0, 10);
  if (coinList.children.length === 0) {
    loadingState();
  }
  let symbol = "$";
  let coinOutput = "";
  if (currency === "usd") {
    symbol = "$";
  } else if (currency === "eur") {
    symbol = "€";
  }

  visibleCoins.forEach((coin, index) => {
    const valueTwentyFourHr = coin.price_change_percentage_24h ?? 0;
    const valueOneHr = coin.price_change_percentage_1h_in_currency ?? 0;
    const valueSevenDays = coin.price_change_percentage_7d_in_currency ?? 0;
    const coinRank = coin.market_cap_rank ?? 0;

    const twentyFourHr = getChangeStyle(valueTwentyFourHr);
    const oneHr = getChangeStyle(valueOneHr);
    const sevenDays = getChangeStyle(valueSevenDays);

    coinOutput += `
      <div class="coin-table">
      <div> ${coinRank} </div>
      
      <div class = "coin-info " data-id ="${coin.id}">
        <img class="icon-picture" src="${coin.image}" alt="Coin Icon">
        <div class = "coin-name">
        <h4 >${coin.name}</h4>
        <p>${coin.symbol}</p>
      </div>
      </div>
        <div>${symbol}${coin.current_price}</div>
        <div class="${oneHr.className}">${oneHr.sign}${valueOneHr.toFixed(1)}%</div>
        <div class="${twentyFourHr.className}">${twentyFourHr.sign}${valueTwentyFourHr.toFixed(1)}%</div>
        <div class="${sevenDays.className}">${sevenDays.sign}${valueSevenDays.toFixed(1)}%</div>
        <div>${symbol}${coin.total_volume}</div>
        <div>${symbol}${coin.market_cap}</div>
        </div>

      `;
  });
  coinList.innerHTML = coinOutput;
}

async function loadData() {
  try {
    const coinData = await getCoinsData();
    allCoins = coinData;
    renderCoins(allCoins);
  } catch (error) {
    console.log(error);
    errorState();
  }
}

function autoRefresh() {
  const countTimer = document.getElementById("counter");
  let timeLeft = 60;
  setInterval(() => {
    countTimer.textContent = `Page refresh in ${timeLeft}s `;
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 60;
    }
  }, 1000);
}

function loadingState() {
  coinList.innerHTML = `<span>Loading Coins...</span>`;
}

function errorState() {
  coinList.innerHTML = `<span>Server Down</span>`;
}

function getChangeStyle(value) {
  if (value > 0) {
    return { className: "green", sign: "+" };
  } else {
    return { className: "red", sign: "" };
  }
}

function setupCoinClick() {
  coinList.addEventListener("click", (e) => {
    const clickedCoin = e.target.closest(".coin-info");
    if (!clickedCoin) {
      return;
    } else {
      const coinId = clickedCoin.dataset.id;
      openModal(coinId);
    }
  });
}

function openModal(coinId) {
  const selectedCoin = currentCoins.find((eachCoin) => eachCoin.id === coinId);
  if (!selectedCoin) {
    return;
  } else {
    showModal(selectedCoin);
  }
}

function showModal(selectedCoin) {
  coinModalInner.innerHTML = `
    <div class="coin-modal-content">
      <h4>${selectedCoin.name}</h4>
    </div>
  <canvas id="sparkline-chart"></canvas> 
  `;

  coinModal.style.display = "flex";
  renderSparkLineChart(selectedCoin);
}

function closeModal() {
  coinModal.style.display = "none";
}

async function getMarketChartData(coinId) {
  try {
    const url = `${API_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.prices;
  } catch (error) {
    console.error("Chart fetch error:", error);
  }
}

async function renderSparkLineChart(selectedCoin) {
  const prices = await getMarketChartData(selectedCoin.id);

  if (!prices) return;

  const chartPrices = prices.map((pricePoint) => pricePoint[1]);
  const labels = prices.map((pricePoint) => {
    const date = new Date(pricePoint[0]);
    return date.toLocaleDateString();
  });

  const ctx = document.getElementById("sparkline-chart");

  if (sparklineChart) {
    sparklineChart.destroy();
  }

  sparklineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `${selectedCoin.name} 7 Day Price (${currency.toUpperCase()})`,
          data: chartPrices,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: "blue",
          backgroundColor: "transparent",
          tension: 0.3,
        },
      ],
    },
  });
}

function sortData() {
  filterCoins.addEventListener("click", (e) => {
    const clickedHeader = e.target.closest(".col");
    if (!clickedHeader) {
      return;
    }

    const headerBtn = document.querySelectorAll(".col");
    headerBtn.forEach((headerBtn) => {
      headerBtn.classList.remove("active");
    });
    clickedHeader.classList.add("active");
    const oneHeader = clickedHeader.dataset.sort;
    {
      if (typeof currentCoins[0][oneHeader] === "string") {
        if (sortDirection === "desc") {
          currentCoins.sort((a, b) => b[oneHeader].localeCompare(a[oneHeader]));
          sortDirection = "asc";
        } else {
          currentCoins.sort((a, b) => a[oneHeader].localeCompare(b[oneHeader]));
          sortDirection = "desc";
        }
      } else {
        if (sortDirection === "desc") {
          currentCoins.sort((a, b) => a[oneHeader] - b[oneHeader]);
          sortDirection = "asc";
        } else {
          currentCoins.sort((a, b) => b[oneHeader] - a[oneHeader]);
          sortDirection = "desc";
        }
      }
      renderCoins(currentCoins);
    }
  });
}

coinModalCloseBtn.addEventListener("click", closeModal);

function callFunction() {
  setupCoinClick();
  buttonText();
  loadData();
  autoRefresh();
  sortData();
}

callFunction();
