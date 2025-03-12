let stockChart, volumeChart;
const apiKey = "cv883ohr01qqdqh4dpbgcv883ohr01qqdqh4dpc0"; // Replace with your Finnhub API Key
const twelveDataApiKey = "74c9f1192d2d412898fc16389575a2c9";
const marketauxApiKey = "NbAmeHB9gMRVuDcxYuWAdlE4jgSCQWqTXIfCOEph";

// Function to fetch real-time stock price
async function fetchStockData(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.c === undefined) {
            console.error("Error fetching stock data:", data);
            return;
        }

        displayStockData(data, symbol);
    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

// Function to display real-time stock price
function displayStockData(data, symbol) {
    const stockInfo = document.getElementById("stockInfo");
    
    stockInfo.innerHTML = `
        <h2>${symbol}</h2>
        <p><strong>Current Price:</strong> $${data.c.toFixed(2)}</p>
        <p><strong>Open:</strong> $${data.o.toFixed(2)}</p>
        <p><strong>High:</strong> $${data.h.toFixed(2)}</p>
        <p><strong>Low:</strong> $${data.l.toFixed(2)}</p>
        <p><strong>Previous Close:</strong> $${data.pc.toFixed(2)}</p>
    `;
}

// Function to fetch historical stock data (last 7 days)
async function fetchHistoricalData(symbol) {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&apikey=${twelveDataApiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length < 2) {
            console.error("Error fetching historical data:", data);
            return;
        }

        updateCharts(data, symbol);
        displayStockPerformance(data.values, symbol);
    } catch (error) {
        console.error("Error fetching historical stock data:", error);
    }
}

function displayStockPerformance(prices, symbol) {
  const stockInfo = document.getElementById("stockInfo");

  const latestClose = parseFloat(prices[0].close);
  const previousClose = parseFloat(prices[1].close);

  const percentageChange = ((latestClose - previousClose) / previousClose) * 100;
  const changeDirection = percentageChange >= 0 ? "Up" : "Down";
  const changeColor = percentageChange >= 0 ? "green" : "red";

  const performanceHTML = `
    <p style="color: ${changeColor}; font-weight: bold;">
      ${changeDirection} ${percentageChange.toFixed(2)}% (Compared to Yesterday)
    </p>
  `;

  stockInfo.innerHTML += performanceHTML;
}

// Function to update price and volume charts
function updateCharts(data, symbol) {
  const priceCanvas = document.getElementById("stockChart");
  const volumeCanvas = document.getElementById("volumeChart");

  if(!priceCanvas || !volumeCanvas) {
    console.error("Canvas elements not found!");
    return;
  }

    const ctxPrice = document.getElementById("stockChart").getContext("2d");
    const ctxVolume = document.getElementById("volumeChart").getContext("2d");

    if (!data.values || !data.values.length === 0) {
        console.error("Missing historical stock data!");
        return;
    }

    const timestamps = data.values.map(entry => entry.datetime).reverse();
    const prices = data.values.map(entry => parseFloat(entry.close)).reverse();
    const volumes = data.values.map(entry => parseFloat(entry.volume) || 0).reverse();

    if (stockChart) stockChart.destroy();
    if (volumeChart) volumeChart.destroy();

    // Price Chart
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

    // Volume Chart
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

    console.log("Charts updated successfully!");
}

// Function to fetch stock news from Finnhub
async function fetchStockNews(symbol) {
    const url = `https://api.marketaux.com/v1/news/all?symbols=${symbol}&filter_entities=true&api_token=${marketauxApiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("MarketAux API Response: ", data); // DEBBUGING STEP

        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
            console.warn("No news found for this stock.");
            document.getElementById("newsSection").innerHTML = `<p>No recent news found for ${symbol}.</p>`;
            return;
        }

        displayStockNews(data.data);
    } catch (error) {
        console.error("Error fetching stock news:", error);
        document.getElementById("newsSection").innerHTML = `<p>Error fetching news.</p>`;
    }
}

// Function to display stock news
function displayStockNews(news) {
  if (!Array.isArray(news)) {
    console.error("Invalid news data format: ", news);
    document.getElementById("newsSection").innerHTML = `<p>Error displaying news.</p>`;
    return;
  }

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

// Event listener for search button
document.getElementById("searchBtn").addEventListener("click", function () {
    const stockSymbol = document.getElementById("stockSymbol").value.toUpperCase();
    if (!stockSymbol) return alert("Please enter a stock symbol!");

    fetchStockData(stockSymbol);
    fetchHistoricalData(stockSymbol);
    fetchStockNews(stockSymbol);
});
