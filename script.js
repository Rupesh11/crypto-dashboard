const API_KEY = "CG-EXAgPfFigPe2qiSZuytxLjuc";

const coinList = document.getElementById("coin-lists");

async function getCoinsData() {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=1h,24h,7d&sparkline=true&x_cg_demo_api_key=CG-EXAgPfFigPe2qiSZuytxLjuc";

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
    loadingState();
    const coinData = await getCoinsData();
    let coinOutput = "";

    coinData.forEach((coin, index) => {
      const valueTwentyFourHr = coin.price_change_percentage_24h ?? 0;
      const valueOneHr = coin.price_change_percentage_1h_in_currency ?? 0;
      const valueSevenDays = coin.price_change_percentage_7d_in_currency ?? 0;

      const twentyFourHr = getChangeStyle(valueTwentyFourHr);
      const oneHr = getChangeStyle(valueOneHr);
      const sevenDays = getChangeStyle(valueSevenDays);

      coinOutput += `
      <div class="coin-table">
        <div class = "coin-name">
        <div> ${index + 1} </div>
        <img class="icon-picture" src="${coin.image}" alt="Coin Icon">
        <h4>${coin.name}</h4>
        <p>${coin.symbol}</p>
        </div>
        <div class = "coin-stats">
        <p>${coin.current_price}</p>
        <p class="${oneHr.className}">${oneHr.sign}${valueOneHr.toFixed(1)}%</p>
        <p class="${twentyFourHr.className}">${twentyFourHr.sign}${valueTwentyFourHr.toFixed(1)}%</p>
        <p class="${sevenDays.className}">${sevenDays.sign}${valueSevenDays.toFixed(1)}%</p>
        <p>${coin.total_volume}</p>
        <p>${coin.market_cap}</p>
        </div>
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
  setInterval(() => {
    renderCoins();
  }, 60000);
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
