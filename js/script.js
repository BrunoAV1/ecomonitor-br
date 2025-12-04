/**
 * EcoMonitor-BR - Main JavaScript
 * Pure ES6+ JavaScript for Weather Monitoring Dashboard
 */

// ========================================
// Configuration & Constants
// ========================================
const CONFIG = {
    API_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
    AIR_API_BASE_URL: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
    TIMEZONE: 'America/Sao_Paulo',
    UPDATE_INTERVAL: 300000, // 5 minutes in milliseconds
};

// City coordinates (stored in HTML data attributes)
const cities = {
    'sao-paulo': { lat: -23.5505, lon: -46.6333, name: 'São Paulo' },
    'rio-de-janeiro': { lat: -22.9068, lon: -43.1729, name: 'Rio de Janeiro' },
    'manaus': { lat: -3.1190, lon: -60.0217, name: 'Manaus' },
};

// ========================================
// State Management
// ========================================
let weatherChart = null;
let currentCity = 'sao-paulo';
let currentCityName = 'São Paulo';
let currentLocation = { lat: -23.5505, lon: -46.6333 };
let primaryHourly = null;
let comparisonHourly = null;
let comparisonCityName = '';
let comparisonLocation = null;
let updateTimer = null;
let searchTimeout = null;

// ========================================
// DOM Elements
// ========================================
const elements = {
    citySearch: document.getElementById('city-search'),
    searchBtn: document.getElementById('search-btn'),
    searchResults: document.getElementById('search-results'),
    compareSearch: document.getElementById('compare-search'),
    compareBtn: document.getElementById('compare-btn'),
    compareResults: document.getElementById('compare-results'),
    clearCompare: document.getElementById('clear-compare'),
    compareBadge: document.getElementById('compare-badge'),
    compareCityName: document.getElementById('compare-city-name'),
    currentCityName: document.getElementById('current-city-name'),
    lastUpdate: document.getElementById('last-update'),
    temperatureValue: document.getElementById('temperature-value'),
    humidityValue: document.getElementById('humidity-value'),
    windValue: document.getElementById('wind-value'),
    aqiValue: document.getElementById('aqi-value'),
    aqiStatus: document.getElementById('aqi-status'),
    chartCanvas: document.getElementById('weather-chart'),
};

// ========================================
// API Functions
// ========================================

/**
 * Searches for cities using Open-Meteo Geocoding API
 * @param {string} query - City name to search
 * @returns {Promise<Array>} Array of city results
 */
async function searchCities(query) {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const params = new URLSearchParams({
            name: query.trim(),
            count: 10,
            language: 'pt',
            format: 'json',
        });

        const response = await fetch(`${CONFIG.GEOCODING_API}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching cities:', error);
        return [];
    }
}

/**
 * Fetches air quality data (AQI) from Open-Meteo Air Quality API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<number|null>} Latest US AQI value or null
 */
async function fetchAirQualityData(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            hourly: 'us_aqi',
            timezone: 'auto',
            forecast_days: 1,
        });

        const response = await fetch(`${CONFIG.AIR_API_BASE_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aqiSeries = data?.hourly?.us_aqi;
        if (!aqiSeries || !Array.isArray(aqiSeries) || aqiSeries.length === 0) {
            return null;
        }

        // Use the most recent value
        return aqiSeries[aqiSeries.length - 1];
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        return null;
    }
}

/**
 * Fetches weather data from Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
async function fetchWeatherData(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            timezone: CONFIG.TIMEZONE,
            forecast_days: 1,
        });

        const response = await fetch(`${CONFIG.API_BASE_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Erro ao buscar dados climáticos. Tente novamente.');
        throw error;
    }
}

// ========================================
// UI Update Functions
// ========================================

/**
 * Updates the current weather cards with real-time data
 * @param {Object} currentData - Current weather data from API
 */
function updateWeatherCards(currentData) {
    const { temperature_2m, relative_humidity_2m, wind_speed_10m } = currentData;
    
    // Update temperature
    elements.temperatureValue.textContent = `${Math.round(temperature_2m)}°C`;
    
    // Update humidity
    elements.humidityValue.textContent = `${Math.round(relative_humidity_2m)}%`;
    
    // Update wind speed
    elements.windValue.textContent = `${Math.round(wind_speed_10m)} km/h`;
    
    // Update city name display
    elements.currentCityName.textContent = currentCityName;
    
    // Update last update timestamp
    updateLastUpdateTime();
}

/**
 * Updates or creates the Chart.js weather chart
 * @param {Object} primaryHourly - Hourly weather data for main city
 * @param {Object|null} comparisonHourly - Hourly data for comparison city
 * @param {string} comparisonName - Comparison city name
 */
function updateChart(primaryHourly, comparisonHourly = null, comparisonName = '') {
    if (!primaryHourly) return;

    const primaryTime = primaryHourly.time || [];
    const labels = primaryTime.map(timestamp => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });

    // Align data lengths to avoid mismatched arrays
    const alignLength = comparisonHourly && Array.isArray(comparisonHourly.time)
        ? Math.min(primaryTime.length, comparisonHourly.time.length)
        : primaryTime.length;

    const primaryData = {
        temperature: (primaryHourly.temperature_2m || []).slice(0, alignLength),
        humidity: (primaryHourly.relative_humidity_2m || []).slice(0, alignLength),
        wind: (primaryHourly.wind_speed_10m || []).slice(0, alignLength),
    };

    const comparisonData = comparisonHourly ? {
        temperature: (comparisonHourly.temperature_2m || []).slice(0, alignLength),
        humidity: (comparisonHourly.relative_humidity_2m || []).slice(0, alignLength),
        wind: (comparisonHourly.wind_speed_10m || []).slice(0, alignLength),
    } : null;

    const datasets = [
        {
            label: `Temperatura (°C) - ${currentCityName}`,
            data: primaryData.temperature,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
        },
        {
            label: `Umidade (%) - ${currentCityName}`,
            data: primaryData.humidity,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            yAxisID: 'y1',
        },
        {
            label: `Vento (km/h) - ${currentCityName}`,
            data: primaryData.wind,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            yAxisID: 'y2',
        },
    ];

    if (comparisonData && comparisonName) {
        datasets.push(
            {
                label: `Temperatura (°C) - ${comparisonName}`,
                data: comparisonData.temperature,
                borderColor: '#fbbf24',
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                borderWidth: 2.5,
                borderDash: [6, 4],
                tension: 0.35,
                fill: false,
                yAxisID: 'y',
            },
            {
                label: `Umidade (%) - ${comparisonName}`,
                data: comparisonData.humidity,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.08)',
                borderWidth: 2.5,
                borderDash: [6, 4],
                tension: 0.35,
                fill: false,
                yAxisID: 'y1',
            },
            {
                label: `Vento (km/h) - ${comparisonName}`,
                data: comparisonData.wind,
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(167, 139, 250, 0.08)',
                borderWidth: 2.5,
                borderDash: [6, 4],
                tension: 0.35,
                fill: false,
                yAxisID: 'y2',
            }
        );
    }

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels.slice(0, alignLength),
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 13,
                            weight: '600',
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'line',
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += Math.round(context.parsed.y * 10) / 10;
                            return label;
                        }
                    }
                },
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: '#334155',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12,
                    },
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperatura (°C)',
                        color: '#f59e0b',
                        font: {
                            size: 12,
                            weight: '600',
                        },
                    },
                    grid: {
                        color: '#334155',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#94a3b8',
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Umidade (%)',
                        color: '#3b82f6',
                        font: {
                            size: 12,
                            weight: '600',
                        },
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#94a3b8',
                    },
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                },
            },
        },
    };

    if (weatherChart) {
        weatherChart.destroy();
    }
    weatherChart = new Chart(elements.chartCanvas, chartConfig);
}

/**
 * Updates the last update timestamp display
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const dateString = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
    
    elements.lastUpdate.textContent = `Atualizado em ${dateString} às ${timeString}`;
}

/**
 * Shows an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.lastUpdate.textContent = `❌ ${message}`;
    elements.lastUpdate.style.color = '#ef4444';
    
    // Reset color after 5 seconds
    setTimeout(() => {
        elements.lastUpdate.style.color = '';
    }, 5000);
}

/**
 * Shows loading state
 */
function showLoading() {
    elements.lastUpdate.textContent = '🔄 Carregando dados...';
    document.querySelector('.control-panel').classList.add('loading');
}

/**
 * Hides loading state
 */
function hideLoading() {
    document.querySelector('.control-panel').classList.remove('loading');
}

/**
 * Displays search results in the dropdown
 * @param {Array} results - Array of city search results
 */
function displaySearchResults(results, container = elements.searchResults, clickHandler = handleSearchResultClick) {
    const resultsContainer = container;
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">Nenhuma cidade encontrada</div>';
        resultsContainer.classList.add('active');
        return;
    }
    
    const resultsHTML = results.map(city => {
        const cityName = city.name;
        const country = city.country || '';
        const admin1 = city.admin1 || '';
        const admin2 = city.admin2 || '';
        
        let cityInfo = [admin2, admin1, country].filter(Boolean).join(', ');
        
        return `
            <div class="search-result-item" 
                 data-lat="${city.latitude}" 
                 data-lon="${city.longitude}"
                 data-name="${cityName}"
                 data-fullname="${cityName}${cityInfo ? ` - ${cityInfo}` : ''}">
                <div class="result-city-name">${cityName}</div>
                <div class="result-city-info">${cityInfo}</div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.classList.add('active');
    
    // Add click handlers to results
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', clickHandler);
    });
}

/**
 * Hides search results dropdown
 */
function hideSearchResults(container = elements.searchResults) {
    container.classList.remove('active');
    container.innerHTML = '';
}

/**
 * Shows loading state in search results
 */
function showSearchLoading(container = elements.searchResults) {
    container.innerHTML = '<div class="search-loading">🔍 Buscando cidades...</div>';
    container.classList.add('active');
}

// ========================================
// AQI Helpers
// ========================================

function getAqiStatus(aqiValue) {
    if (aqiValue === null || aqiValue === undefined || Number.isNaN(aqiValue)) {
        return { label: 'Sem dados', className: '' };
    }

    if (aqiValue <= 50) return { label: 'Bom', className: 'aqi-status-good' };
    if (aqiValue <= 100) return { label: 'Moderado', className: 'aqi-status-moderate' };
    if (aqiValue <= 150) return { label: 'Ruim para sensíveis', className: 'aqi-status-poor' };
    return { label: 'Ruim', className: 'aqi-status-bad' };
}

function updateAqiCard(aqiValue) {
    const status = getAqiStatus(aqiValue);
    elements.aqiValue.textContent = Number.isFinite(aqiValue) ? Math.round(aqiValue) : '--';
    elements.aqiStatus.textContent = status.label;
    
    // Reset classes
    const card = elements.aqiValue.closest('.weather-card');
    card.classList.remove('aqi-status-good', 'aqi-status-moderate', 'aqi-status-poor', 'aqi-status-bad');
    if (status.className) {
        card.classList.add(status.className);
    }
}

// ========================================
// Main Update Function
// ========================================

/**
 * Main function to update all weather data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} cityName - City name for display
 */
async function updateWeatherData(lat, lon, cityName) {
    try {
        showLoading();
        
        // Update current location and city name
        currentLocation = { lat, lon };
        currentCityName = cityName;
        
        // Fetch data from API in parallel
        const [weatherData, aqiValue] = await Promise.all([
            fetchWeatherData(lat, lon),
            fetchAirQualityData(lat, lon),
        ]);
        
        // Persist primary series
        primaryHourly = weatherData.hourly;
        
        // Update UI components
        updateWeatherCards(weatherData.current);
        updateAqiCard(aqiValue);
        updateChart(primaryHourly, comparisonHourly, comparisonCityName);
        
        hideLoading();
    } catch (error) {
        console.error('Error updating weather data:', error);
        hideLoading();
    }
}

/**
 * Updates comparison city data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} cityName - City name for display
 */
async function updateComparisonData(lat, lon, cityName) {
    try {
        comparisonLocation = { lat, lon };
        comparisonCityName = cityName;

        const weatherData = await fetchWeatherData(lat, lon);
        comparisonHourly = weatherData.hourly;

        // Update chart with both datasets
        updateChart(primaryHourly, comparisonHourly, comparisonCityName);

        // Show badge
        elements.compareCityName.textContent = comparisonCityName;
        elements.compareBadge.hidden = false;
    } catch (error) {
        console.error('Error updating comparison data:', error);
        showError('Não foi possível atualizar a cidade de comparação');
    }
}

// ========================================
// Event Handlers
// ========================================

/**
 * Handles city search input with debouncing
 * @param {Event} event - Input event
 */
async function handleCitySearch(event) {
    const query = event.target.value;
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Hide results if query is too short
    if (!query || query.trim().length < 2) {
        hideSearchResults();
        return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(async () => {
        showSearchLoading(elements.searchResults);
        const results = await searchCities(query);
        displaySearchResults(results, elements.searchResults, handleSearchResultClick);
    }, 300);
}

/**
 * Handles comparison search input with debouncing
 * @param {Event} event - Input event
 */
async function handleCompareSearch(event) {
    const query = event.target.value;

    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (!query || query.trim().length < 2) {
        hideSearchResults(elements.compareResults);
        return;
    }

    searchTimeout = setTimeout(async () => {
        showSearchLoading(elements.compareResults);
        const results = await searchCities(query);
        displaySearchResults(results, elements.compareResults, handleCompareResultClick);
    }, 300);
}

/**
 * Handles search result item click
 * @param {Event} event - Click event
 */
function handleSearchResultClick(event) {
    const item = event.currentTarget;
    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);
    const cityName = item.dataset.name;
    const fullName = item.dataset.fullname;
    
    // Update weather data
    updateWeatherData(lat, lon, fullName);
    
    // If comparison active, refresh it to keep chart aligned
    if (comparisonLocation && comparisonCityName) {
        updateComparisonData(comparisonLocation.lat, comparisonLocation.lon, comparisonCityName);
    }
    
    // Clear search and hide results
    elements.citySearch.value = '';
    hideSearchResults(elements.searchResults);
    
    // Reset auto-update timer
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    startAutoUpdate();
}

/**
 * Handles comparison search result click
 * @param {Event} event - Click event
 */
function handleCompareResultClick(event) {
    const item = event.currentTarget;
    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);
    const fullName = item.dataset.fullname;

    updateComparisonData(lat, lon, fullName);

    // Clear search and hide results
    elements.compareSearch.value = '';
    hideSearchResults(elements.compareResults);

    // Reset auto-update timer
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    startAutoUpdate();
}

/**
 * Handles search button click
 */
async function handleSearchClick() {
    const query = elements.citySearch.value;
    
    if (!query || query.trim().length < 2) {
        showError('Digite pelo menos 2 caracteres para buscar');
        return;
    }
    
    showSearchLoading(elements.searchResults);
    const results = await searchCities(query);
    displaySearchResults(results, elements.searchResults, handleSearchResultClick);
}

/**
 * Handles compare search button click
 */
async function handleCompareSearchClick() {
    const query = elements.compareSearch.value;

    if (!query || query.trim().length < 2) {
        showError('Digite pelo menos 2 caracteres para buscar a comparação');
        return;
    }

    showSearchLoading(elements.compareResults);
    const results = await searchCities(query);
    displaySearchResults(results, elements.compareResults, handleCompareResultClick);
}

/**
 * Clears comparison state
 */
function clearComparison() {
    comparisonLocation = null;
    comparisonCityName = '';
    comparisonHourly = null;
    elements.compareBadge.hidden = true;
    elements.compareCityName.textContent = '';
    hideSearchResults(elements.compareResults);
    elements.compareSearch.value = '';
    updateChart(primaryHourly, null, '');
}

/**
 * Starts automatic weather data updates
 */
function startAutoUpdate() {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    updateTimer = setInterval(() => {
        updateWeatherData(currentLocation.lat, currentLocation.lon, currentCityName);
        if (comparisonLocation && comparisonCityName) {
            updateComparisonData(comparisonLocation.lat, comparisonLocation.lon, comparisonCityName);
        }
    }, CONFIG.UPDATE_INTERVAL);
}

// ========================================
// Initialization
// ========================================

/**
 * Initializes the application
 */
function initApp() {
    // Add event listeners
    elements.citySearch.addEventListener('input', handleCitySearch);
    elements.searchBtn.addEventListener('click', handleSearchClick);
    elements.compareSearch.addEventListener('input', handleCompareSearch);
    elements.compareBtn.addEventListener('click', handleCompareSearchClick);
    elements.clearCompare.addEventListener('click', clearComparison);
    
    // Handle Enter key in search
    elements.citySearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        } else if (e.key === 'Escape') {
            hideSearchResults(elements.searchResults);
        }
    });

    elements.compareSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleCompareSearchClick();
        } else if (e.key === 'Escape') {
            hideSearchResults(elements.compareResults);
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        const clickOutsidePrimary = !elements.searchResults.contains(e.target) && 
            e.target !== elements.citySearch && 
            e.target !== elements.searchBtn;
        const clickOutsideCompare = !elements.compareResults.contains(e.target) &&
            e.target !== elements.compareSearch &&
            e.target !== elements.compareBtn;
        
        if (clickOutsidePrimary) {
            hideSearchResults(elements.searchResults);
        }
        if (clickOutsideCompare) {
            hideSearchResults(elements.compareResults);
        }
    });
    
    // Load initial weather data (São Paulo)
    const initialCity = cities[currentCity];
    updateWeatherData(initialCity.lat, initialCity.lon, initialCity.name);
    
    // Start auto-update
    startAutoUpdate();
    
    console.log('✅ EcoMonitor-BR initialized successfully');
}

// ========================================
// App Entry Point
// ========================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ========================================
// Cleanup on page unload
// ========================================
window.addEventListener('beforeunload', () => {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    if (weatherChart) {
        weatherChart.destroy();
    }
});
