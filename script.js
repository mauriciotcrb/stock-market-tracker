// ========================= //
// 📌 API KEYS
// ========================= //
const FINNHUB_API_KEY = "cv883ohr01qqdqh4dpbgcv883ohr01qqdqh4dpc0"; 
const TWELVEDATA_API_KEY = "74c9f1192d2d412898fc16389575a2c9";
const MARKETAUX_API_KEY = "NbAmeHB9gMRVuDcxYuWAdlE4jgSCQWqTXIfCOEph";

let stockChart, volumeChart;

// ========================= //
// 📌 AUTOCOMPLETE STOCK SEARCH
// ========================= //
async function fetchStockSymbols(query) {
    if (query.length < 1) {
        document.getElementById("autocompleteResults").style.display = "none";
        return;
    }

    const url = `https://api.twelvedata.com/symbol_search?symbol=${query}&apikey=${TWELVEDATA_API_KEY}`;
  
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            document.getElementById("autocompleteResults").style.display = "none";
            return;
        }

        displayAutocompleteResults(data.data);
    } catch (error) {
        console.error("Error fetching stock symbols:", error);
    }
}

function displayAutocompleteResults(symbols) {
    const autocompleteBox = document.getElementById("autocompleteResults");
    autocompleteBox.innerHTML = "";

    symbols.slice(0, 5).forEach(stock => {
        const item = document.createElement("div");
        item.textContent = `${stock.symbol} - ${stock.instrument_name}`;
        item.classList.add("autocomplete-item");

        item.onclick = function () {
            document.getElementById("stockSymbol").value = stock.symbol;
            autocompleteBox.style.display = "none";
        };

        autocompleteBox.style.display = "block";
        autocompleteBox.appendChild(item);
    });
}

document.getElementById("stockSymbol").addEventListener("input", function () {
    fetchStockSymbols(this.value.trim());
});

document.addEventListener("click", function (event) {
    if (!event.target.matches("#stockSymbol")) {
        document.getElementById("autocompleteResults").style.display = "none";
    }
});

// ========================= //
// 📌 FETCH STOCK DATA (REAL-TIME)
// ========================= //
async function fetchStockData(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.c === undefined) {
            console.error("Error fetching stock data:", data);
            return;
        }

        displayStockData(data, symbol);
        fetchHistoricalData(symbol);
        fetchStockNews(symbol);
        updateCharts(data, symbol);
    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

// ✅ Fetch Market Index Data and Update Price, Percentage Change, and Amount Change
async function fetchMarketData(symbol, priceElement, changeElement) {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVEDATA_API_KEY}`;

  try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "error" || !data.close) {
          console.error(`❌ Error fetching data for: ${symbol}`, data);
          document.getElementById(priceElement).textContent = "N/A";
          document.getElementById(changeElement).innerHTML = `<span style="color: gray;">No data</span>`;

          return;
      }

      // ✅ Update stock price
      document.getElementById(priceElement).textContent = `$${parseFloat(data.close).toFixed(2)}`;

      // ✅ Update percentage and amount change
      const changePercentage = parseFloat(data.percent_change).toFixed(2);
      const changeAmount = parseFloat(data.change).toFixed(2);

      const changePercentageElement = document.querySelector(`#${changeElement} .change-percentage`);
      const changeAmountElement = document.querySelector(`#${changeElement} .change-amount`);

      let color = "gray";

      if (changePercentageElement && changeAmountElement) {
          changePercentageElement.textContent = `${changePercentage}%`;
          changeAmountElement.textContent = `$${changeAmount}`;

          // ✅ Apply color changes (Green for positive, Red for negative)
          color = changePercentage >= 0 ? "green" : "red";
          changePercentageElement.style.color = color;
          changeAmountElement.style.color = color;
      }

      // ✅ Update left border color dynamically
      const marketCard = document.querySelector(`[data-symbol="${symbol}"]`);
      if (marketCard) {
          marketCard.style.borderLeft = `5px solid ${color}`;
      }

  } catch (error) {
      console.error(`❌ Error fetching market data for: ${symbol}`, error);
      document.getElementById(priceElement).textContent = "Error";
      document.getElementById(changeElement).innerHTML = `<span style="color: red;">Error</span>`;
  }
}

function displayStockData(data, symbol) {
    document.getElementById("stockInfo").innerHTML = `
        <h3>${symbol}</h3>
        <p><strong>Current Price:</strong> $${data.c.toFixed(2)}</p>
        <p><strong>Open:</strong> $${data.o.toFixed(2)}</p>
        <p><strong>High:</strong> $${data.h.toFixed(2)}</p>
        <p><strong>Low:</strong> $${data.l.toFixed(2)}</p>
        <p><strong>Previous Close:</strong> $${data.pc.toFixed(2)}</p>
    `;
}

// ========================= //
// 📌 FETCH HISTORICAL DATA
// ========================= //
async function fetchHistoricalData(symbol) {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&apikey=${TWELVEDATA_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length < 2) {
            console.error("Error fetching historical data:", data);
            return;
        }

        updateCharts(data, symbol);
    } catch (error) {
        console.error("Error fetching historical stock data:", error);
    }
}

// ========================= //
// 📌 UPDATE CHARTS
// ========================= //
function updateCharts(data, symbol) {
    const ctxPrice = document.getElementById("stockChart").getContext("2d");
    const ctxVolume = document.getElementById("volumeChart").getContext("2d");

    const timestamps = data.values.map(entry => entry.datetime).reverse();
    const prices = data.values.map(entry => parseFloat(entry.close)).reverse();
    const volumes = data.values.map(entry => parseFloat(entry.volume) || 0).reverse();

    if (stockChart) stockChart.destroy();
    if (volumeChart) volumeChart.destroy();

    stockChart = new Chart(ctxPrice, {
        type: "line",
        data: {
            labels: timestamps,
            datasets: [{
                label: `${symbol} Stock Price ($)`,
                data: prices,
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.2)",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Price ($)" } }
            }
        }
    });

    volumeChart = new Chart(ctxVolume, {
        type: "bar",
        data: {
            labels: timestamps,
            datasets: [{
                label: `${symbol} Trading Volume`,
                data: volumes,
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Volume" } }
            }
        }
    });
}

// ========================= //
// 📌 FETCH STOCK NEWS
// ========================= //
async function fetchStockNews(symbol) {
    const url = `https://api.marketaux.com/v1/news/all?symbols=${symbol}&filter_entities=true&api_token=${MARKETAUX_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.data || data.data.length === 0) {
            document.getElementById("newsSection").innerHTML = `<p>No recent news found for ${symbol}.</p>`;
            return;
        }

        displayStockNews(data.data);
    } catch (error) {
        console.error("Error fetching stock news:", error);
        document.getElementById("newsSection").innerHTML = `<p>Error fetching news.</p>`;
    }
}

function displayStockNews(news) {
    const newsSection = document.getElementById("newsSection");
    newsSection.innerHTML = "<h3>Latest News</h3>";

    news.slice(0, 5).forEach(article => {
        const newsItem = document.createElement("div");
        newsItem.innerHTML = `
            <p><strong>${article.title}</strong></p>
            <p>${article.source}</p>
            <a href="${article.url}" target="_blank">Read more</a>
            <hr>
        `;
        newsSection.appendChild(newsItem);
    });
}

// ========================= //
// 📌 EVENT LISTENERS
// ========================= //
document.getElementById("searchBtn").addEventListener("click", function () {
    const stockSymbol = document.getElementById("stockSymbol").value.toUpperCase();
    if (!stockSymbol) return alert("Please enter a stock symbol!");

    fetchStockData(stockSymbol);
});

document.querySelectorAll(".market-card").forEach(card => {
    card.addEventListener("click", function () {
        document.querySelectorAll(".market-card").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        fetchStockData(this.getAttribute("data-symbol"));
    });
});

// ========================= //
// 📌 LOAD DEFAULT STOCK (DJIA) ON PAGE LOAD
// ========================= //
// ✅ Fetch all market indices when the page loads
document.addEventListener("DOMContentLoaded", function () {
  const marketIndices = [
      { symbol: "DJIA", priceId: "djia-price", changeId: "djia-change" },
      { symbol: "COMP", priceId: "nasdaq-price", changeId: "nasdaq-change" },
      { symbol: "SPX", priceId: "sp500-price", changeId: "sp500-change" },
      { symbol: "RUSSELL2000", priceId: "rut-price", changeId: "rut-change" },
      { symbol: "VXX", priceId: "vix-price", changeId: "vix-change" },
      { symbol: "UKX", priceId: "ftse-price", changeId: "ftse-change" },
      { symbol: "DAX", priceId: "dax-price", changeId: "dax-change" },
      { symbol: "N225", priceId: "nikkei-price", changeId: "nikkei-change" }
  ];

  marketIndices.forEach(index => fetchMarketData(index.symbol, index.priceId, index.changeId));

  // ✅ Load Dow Jones (DJIA) chart by default
  fetchStockData("DJIA");
});
