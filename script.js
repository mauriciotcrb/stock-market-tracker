const apiKey = "97JTJ58JGN963IY9";
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", function() {
  const stockSymbol = document.getElementById("stockSymbol").value.toUpperCase();
  if (!stockSymbol) return alert("Please enter a stock symbol");

  fetchStockData(stockSymbol);
});

async function fetchStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayStockData(data, symbol);
  } catch (error) {
    console.error("Error fetching stock data:", error);
  }
}

function displayStockData(data, symbol) {
  const stockInfo = document.getElementById("stockInfo");
  if(!data["Time Series (5min)"]) {
    stockInfo.innerHTML = `<p>Error fetching data. Please check the stock symbol.</p>`;
    return;
  }

  const timeSeries = data["Time Series (5min)"];
  const latestTimestamp = Object.keys(timeSeries)[0];
  const latestData = timeSeries[latestTimestamp];

  stockInfo.innerHTML = `
    <h2>${symbol}</h2>
    <p>Latest Price: $${latestData["1. open"]}</p>
    <p>Time: ${latestTimestamp}</p>
  `;

  updateChart(timeSeries);
}

let stockChart;

function updateChart(timeSeries) {
  const ctx = document.getElementById("stockChart").getContext("2d");
  const timestamps = Object.keys(timeSeries).slice(0, 10).reverse();
  const prices = timestamps.map(time => parseFloat(timeSeries[time]["1. open"]));

  if (stockChart) stockChart.destroy();

  stockChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: timestamps,
      datasets: [{
        label: "Stock Price ($)",
        data: prices,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Time" } },
        y: { title: { display: true, text: "Price ($)" } }
      }
    }
  });
}