let stockChart, volumeChart;

// Function to fetch real-time stock price
async function fetchStockData(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.chart || !data.chart.result) {
            console.error("Error fetching stock data:", data);
            return;
        }

        displayStockData(data.chart.result[0], symbol);
    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

// Function to display the stock's real-time price
function displayStockData(data, symbol) {
    const stockInfo = document.getElementById("stockInfo");

    if (!data || !data.indicators || !data.indicators.quote) {
        stockInfo.innerHTML = `<p>Error fetching data. Please check the stock symbol.</p>`;
        return;
    }

    const latest = data.indicators.quote[0];
    const lastClose = latest.close[latest.close.length - 1];

    stockInfo.innerHTML = `
        <h2>${symbol}</h2>
        <p><strong>Current Price:</strong> $${lastClose.toFixed(2)}</p>
    `;

    updateCharts(data, symbol);
}

// Function to fetch historical stock prices and volume
async function fetchHistoricalData(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.chart || !data.chart.result) {
            console.error("Error fetching historical data:", data);
            return;
        }

        updateCharts(data.chart.result[0], symbol);
    } catch (error) {
        console.error("Error fetching historical stock data:", error);
    }
}

// Function to update the stock price and volume charts
function updateCharts(data, symbol) {
    const ctxPrice = document.getElementById("stockChart").getContext("2d");
    const ctxVolume = document.getElementById("volumeChart").getContext("2d");

    if (!data.timestamp || !data.indicators || !data.indicators.quote) {
        console.error("Missing historical stock data!");
        return;
    }

    const timestamps = data.timestamp.map(t => new Date(t * 1000).toLocaleDateString());
    const prices = data.indicators.quote[0].close;
    const volumes = data.indicators.quote[0].volume;

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

// Function to fetch latest stock news from Yahoo Finance
async function fetchStockNews(symbol) {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.news || data.news.length === 0) {
            console.warn("No news found for this stock.");
            document.getElementById("newsSection").innerHTML = `<p>No recent news found for ${symbol}.</p>`;
            return;
        }

        displayStockNews(data.news);
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
            <p><strong>${article.title}</strong></p>
            <p>${article.publisher}</p>
            <a href="${article.link}" target="_blank">Read more</a>
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
