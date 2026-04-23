const API_KEY = "CG-EXAgPfFigPe2qiSZuytxLjuc";

const coinList = document.getElementById("coin-lists");
const currencyButton = document.querySelector(".currency-button");
let currency = localStorage.getItem("currency") ?? "usd";

currencyButton.addEventListener("click", () => {
  if (currency === "eur") {
    currency = "usd";
    renderCoins();
  } else if (currency === "usd") {
    currency = "eur";
    renderCoins();
  }
  localStorage.setItem("currency", currency);
});
async function getCoinsData() {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1&price_change_percentage=1h,24h,7d&sparkline=true&x_cg_demo_api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function renderCoins() {
  try {
    if (coinList.children.length === 0) {
      loadingState();
    }
    const coinData = await getCoinsData();
    let symbol = "$";
    let coinOutput = "";
    if (currency === "usd") {
      symbol = "$";
    } else if (currency === "eur") {
      symbol = "€";
    }

    coinData.forEach((coin, index) => {
      const valueTwentyFourHr = coin.price_change_percentage_24h ?? 0;
      const valueOneHr = coin.price_change_percentage_1h_in_currency ?? 0;
      const valueSevenDays = coin.price_change_percentage_7d_in_currency ?? 0;

      const twentyFourHr = getChangeStyle(valueTwentyFourHr);
      const oneHr = getChangeStyle(valueOneHr);
      const sevenDays = getChangeStyle(valueSevenDays);

      coinOutput += `
      <div class="coin-table">
      <div> ${index + 1} </div>

      <div class = "coin-info">
        <img class="icon-picture" src="${coin.image}" alt="Coin Icon">
        <div class = "coin-name">
        <h4>${coin.name}</h4>
        <p>${coin.symbol}</p>
      </div>
      </div>
        <div>${symbol}${coin.current_price}</div>
        <div class="${oneHr.className}">${oneHr.sign}${valueOneHr.toFixed(1)}%</div>
        <div class="${twentyFourHr.className}">${twentyFourHr.sign}${valueTwentyFourHr.toFixed(1)}%</div>
        <div class="${sevenDays.className}">${sevenDays.sign}${valueSevenDays.toFixed(1)}%</div>
        <div>${symbol}${coin.total_volume}</div>
        <div>${symbol}${coin.market_cap}</div>
        <div>${symbol}${coin.market_cap}</div>
        </div>

      `;
    });
    coinList.innerHTML = coinOutput;
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
      renderCoins();
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

renderCoins();
autoRefresh();
