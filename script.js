const API_KEY = "CG-EXAgPfFigPe2qiSZuytxLjuc";
const API_URL = `https://api.coingecko.com/api/v3`;
const API_SPARKLINE = `sparkline=true&price_change_percentage=1h,24h,7d`;

const coinList = document.getElementById("coin-lists");
const coinModal = document.getElementById("coin-modal");
const coinModalInner = document.getElementById("coin-modal-inner");
const filterCoins = document.getElementById("filter-coins");
const coinModalCloseBtn = document.getElementById("coin-modal-close-btn");
const currencyButton = document.querySelector(".currency-button");
const input = document.getElementById("search-coin");

let currency = localStorage.getItem("currency") ?? "usd";

let allCoins = [];
let currentCoins = [];
let sparklineChart;

const cache = new Map();

let isSearching = false;
let savedHeader;
let sortDirection = "desc";
let activeSortKey = "";
let debounceTimer;

function buttonText() {
  currencyButton.textContent = currency === "eur" ? "USD" : "EUR";
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

function backHome() {
  const resetButton = document.getElementById("back-home");
  resetButton.addEventListener("click", () => {
    loadData();
  });
}

currencyButton.addEventListener("click", () => {
  const searchTerm = input.value.toLowerCase().trim();
  currency === "eur" ? (currency = "usd") : (currency = "eur");
  buttonText();
  if (searchTerm.length >= 3) {
    searchCoins(searchTerm);
  } else {
    refreshCurrentView();
  }
  localStorage.setItem("currency", currency);
});

async function searchCoins(searchTerm) {
  const API_SEARCH = `${API_URL}/search?query=${searchTerm}&per_page=10&page=1`;
  const cacheKey = `search-${searchTerm}-${currency}`;

  if (searchTerm.length < 3) {
    renderCoins(allCoins);
    return;
  }

  if (cache.has(cacheKey)) {
    renderCoins(cache.get(cacheKey));
    return;
  }

  try {
    if (isSearching) return;

    isSearching = true;
    loadingState();

    const searchResponse = await fetch(API_SEARCH);

    if (!searchResponse.ok) {
      throw new Error(`Search Error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    const coinIds = searchData.coins.slice(0, 10).map((coin) => coin.id);

    if (coinIds.length === 0) {
      coinList.innerHTML = `<span>No coins found</span>`;
      return;
    }

    const marketData = await idSearch(coinIds);

    if (marketData) {
      cache.set(cacheKey, marketData);
      renderCoins(marketData);
    }
  } catch (error) {
    console.log(error);
    errorState();
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

const debounceSearch = debounce(() => {
  searchCoins(input.value.toLowerCase().trim());
}, 1000);

input.addEventListener("input", debounceSearch);

async function getCoinsData() {
  const url = `${API_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&${API_SPARKLINE}&x_cg_demo_api_key=${API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return await response.json();
}

function renderCoins(coinsToRender) {
  currentCoins = coinsToRender;
  const visibleCoins = coinsToRender.slice(0, 10);
  const symbol = getCurrencySymbol();
  if (coinList.children.length === 0) {
    loadingState();
  }

  const coinOutput = coinLoop(visibleCoins, symbol);

  coinList.innerHTML = coinOutput;
}

function getCurrencySymbol() {
  if (currency === "eur") {
    return "€";
  }
  return "$";
}

function coinLoop(visibleCoins, symbol) {
  let coinOutput = "";

  visibleCoins.forEach((coin, index) => {
    const valueOneHr = coin.price_change_percentage_1h_in_currency ?? 0;
    const valueTwentyFourHr = coin.price_change_percentage_24h_in_currency ?? 0;
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
  return coinOutput;
}

async function loadData() {
  try {
    const coinData = await getCoinsData();
    allCoins = coinData;
    renderCoins(allCoins);
  } catch (error) {
    errorState();
  }
}

function autoRefresh() {
  const countTimer = document.getElementById("counter");
  const counterText = document.querySelector(".counter-text");
  let timeLeft = 60;
  setInterval(() => {
    const progress = (timeLeft / 60) * 100;
    counterText.textContent = `Live Data`;
    countTimer.style.setProperty("--progress", `${progress}%  `);
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 60;
      refreshCurrentView();
    }
  }, 1000);
}

async function refreshCurrentView() {
  const searchTerm = input.value.toLowerCase().trim();

  if (searchTerm.length >= 3) {
    cache.delete(`${searchTerm}-${currency}`);
    await searchCoins(searchTerm);
  } else {
    await loadData();
  }
  if (activeSortKey) {
    applySort();
  }
}

function applySort() {
  if (!activeSortKey || currentCoins.length === 0) return;

  currentCoins.sort((a, b) => {
    let valueA = a[activeSortKey];
    let valueB = b[activeSortKey];

    if (valueA === null || valueA === undefined) valueA = 0;
    if (valueB === null || valueA === undefined) valueA = 0;

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
  });

  renderCoins(currentCoins);
}

async function handleHeaderSort() {
  try {
    loadingState();

    const freshTop100 = await getCoinsData();

    allCoins = freshTop100;
    currentCoins = [...freshTop100];

    applySort();
  } catch (error) {
    errorState;
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
  filterCoins.addEventListener("click", async (e) => {
    const clickedHeader = e.target.closest(".col");

    if (!clickedHeader) return;

    const headerBtn = document.querySelectorAll(".col");

    headerBtn.forEach((headerBtn) => {
      headerBtn.classList.remove("active", "asc", "desc");
    });
    clickedHeader.classList.add("active");

    const sortKey = clickedHeader.dataset.sort;

    if (sortKey === activeSortKey) {
      sortDirection = sortDirection === "desc" ? "asc" : "desc";
    } else {
      activeSortKey = sortKey;
      sortDirection = "desc";
    }

    clickedHeader.classList.add(sortDirection);
    await handleHeaderSort();
  });
}

coinModalCloseBtn.addEventListener("click", closeModal);

function callFunction() {
  setupCoinClick();
  buttonText();
  loadData();
  autoRefresh();
  sortData();
  backHome();
}

callFunction();
