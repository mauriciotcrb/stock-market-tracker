let stockChart, volumeChart;
const apiKey = "cv883ohr01qqdqh4dpbgcv883ohr01qqdqh4dpc0"; // Replace with your Finnhub API Key

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
    const today = Math.floor(Date.now() / 1000);
    const lastWeek = today - 7 * 24 * 60 * 60;
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${lastWeek}&to=${today}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.s !== "ok") {
            console.error("Error fetching historical data:", data);
            return;
        }

        updateCharts(data, symbol);
    } catch (error) {
        console.error("Error fetching historical stock data:", error);
    }
}

// Function to update price and volume charts
function updateCharts(data, symbol) {
    const ctxPrice = document.getElementById("stockChart").getContext("2d");
    const ctxVolume = document.getElementById("volumeChart").getContext("2d");

    if (!data.t || !data.c || !data.v) {
        console.error("Missing historical stock data!");
        return;
    }

    const timestamps = data.t.map(t => new Date(t * 1000).toLocaleDateString());
    const prices = data.c;
    const volumes = data.v;

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
    const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2024-03-01&to=2024-03-10&token=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) {
            console.warn("No news found for this stock.");
            document.getElementById("newsSection").innerHTML = `<p>No recent news found for ${symbol}.</p>`;
            return;
        }

        displayStockNews(data);
    } catch (error) {
        console.error("Error fetching stock news:", error);
        document.getElementById("newsSection").innerHTML = `<p>Error fetching news.</p>`;
    }
}

// Function to display stock news
function displayStockNews(news) {
    const newsSection = document.getElementById("newsSection");
    newsSection.innerHTML = "<h3>Latest News</h3>";

    news.slice(0, 5).forEach(article => {
        const newsItem = document.createElement("div");
        newsItem.innerHTML = `
            <p><strong>${article.headline}</strong></p>
            <p>${article.summary}</p>
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
