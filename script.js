const API_KEY = "CG-EXAgPfFigPe2qiSZuytxLjuc";

const coinList = document.getElementById("coin-lists");

async function getCoinsData() {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=24h&x_cg_demo_api_key=CG-EXAgPfFigPe2qiSZuytxLjuc";

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {}
}

async function renderCoins() {
  try {
    loadingState();
    const coinData = await getCoinsData();
    let coinOutput = "";
    coinData.forEach((coin) => {
      const value = coin.price_change_percentage_24h;
      let colorSwitch = "red";
      let plusMinus = "";
      if (value > 0) {
        colorSwitch = "green";
        plusMinus = "+";
      }
      coinOutput += `
      <div class = "coin-box">
      <img class="icon-picture" src = "${coin.image}" alt="Coin Icon">
      <div class = "coin-details">
      <h4>${coin.name}</h4>
      <p>${coin.symbol}</p>
      </div>
      <div class = "coin-stat">
      <p>${coin.current_price}</p>
      <p class="${colorSwitch}" >${plusMinus}${value.toFixed(1)}%</p>
      </div>
      </div>
      `;
    });
    coinList.innerHTML = coinOutput;
  } catch (error) {
    errorState();
  }
}

function autoRefresh() {
  setInterval(() => {
    renderCoins();
  }, 6 * 10000);
}

function loadingState() {
  const loading = `<span>Loading Coins...</span>`;
  coinList.innerHTML = loading;
}

function errorState() {
  const error = `<span>Server Down</span>`;
  coinList.innerHTML = error;
}
renderCoins();
autoRefresh();
