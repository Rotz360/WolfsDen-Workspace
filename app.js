// Drink Data
const drinks = [
    // Cocktails (8-12)
    { id: 1, name: "Vodka Redbull", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.5 },
    { id: 2, name: "Gin Tonic", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.4 },
    { id: 3, name: "Whiskey Sour", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.4 },
    { id: 8, name: "Mojito", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.3 },
    { id: 9, name: "Old Fashioned", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.3 },
    { id: 10, name: "Martini", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.4 },
    { id: 11, name: "Long Island", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.4 },
    { id: 12, name: "Gin Lemon", type: "Cocktail", price: 8.00, initialPrice: 8.00, min: 8.00, max: 12.00, volatility: 0.4 },

    // Beers (5-8)
    { id: 4, name: "Heineken", type: "Beer", price: 5.00, initialPrice: 5.00, min: 5.00, max: 8.00, volatility: 0.2 },
    { id: 5, name: "Corona", type: "Beer", price: 5.00, initialPrice: 5.00, min: 5.00, max: 8.00, volatility: 0.2 },
    { id: 13, name: "Blonde Beer", type: "Beer", price: 5.00, initialPrice: 5.00, min: 5.00, max: 8.00, volatility: 0.2 },
    { id: 14, name: "Guinness", type: "Beer", price: 5.00, initialPrice: 5.00, min: 5.00, max: 8.00, volatility: 0.2 },

    // Shots (4-6)
    { id: 6, name: "Tequila Shot", type: "Shot", price: 4.00, initialPrice: 4.00, min: 4.00, max: 6.00, volatility: 0.6 },
    { id: 7, name: "Jägerbomb", type: "Shot", price: 4.00, initialPrice: 4.00, min: 4.00, max: 6.00, volatility: 0.5 },
    { id: 15, name: "Chupito", type: "Shot", price: 4.00, initialPrice: 4.00, min: 4.00, max: 6.00, volatility: 0.6 }
];

// App State
let crashingDrinkId = null;
let crashEndTime = 0;
// Crash frequency: Random between 2 to 5 minutes
let nextCrashTime = Date.now() + (Math.random() * 180000 + 120000);

// Sound
const crashSound = new Audio('crash.mp3');

// DOM Elements
const gridEl = document.getElementById('drinks-grid');
const tickerEl = document.getElementById('ticker-content');
const tickerBottomEl = document.getElementById('ticker-content-bottom');
const marketStateEl = document.getElementById('market-state');
const nextCrashTimerEl = document.getElementById('next-crash-timer');

// Initialize
function init() {
    // Sort drinks: Cocktail > Beer > Shot
    const typeOrder = { "Cocktail": 1, "Beer": 2, "Shot": 3 };
    drinks.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    // Initialize update times for each drink
    drinks.forEach(drink => {
        scheduleNextUpdate(drink);
    });

    renderGrid();
    renderTicker();

    // Main loop for checking updates and crashes
    setInterval(gameLoop, 1000);
}

function scheduleNextUpdate(drink) {
    // Minimum 1 minute (60000ms) + random 0-60s
    const delay = 60000 + Math.random() * 60000;
    drink.nextUpdate = Date.now() + delay;
}

function gameLoop() {
    const now = Date.now();
    let needsRender = false;

    // 1. Check for individual drink updates
    drinks.forEach(drink => {
        if (drink.id === crashingDrinkId) return;

        if (now >= drink.nextUpdate) {
            updateDrinkPrice(drink);
            scheduleNextUpdate(drink);
            needsRender = true;
        }
    });

    // 2. Check for Crash Start
    if (!crashingDrinkId && now >= nextCrashTime) {
        triggerSingleCrash();
        needsRender = true;
    }

    // 3. Check for Crash End
    if (crashingDrinkId && now >= crashEndTime) {
        endSingleCrash();
        needsRender = true;
    }

    // 4. Update Timer UI
    updateTimerUI(now);

    if (needsRender) {
        renderGrid();
        renderTicker();
    }
}

function updateDrinkPrice(drink) {
    // Change by multiples of 0.10, between 0.10 and 1.50
    // 1 to 15 units of 0.10
    const units = Math.floor(Math.random() * 15) + 1;
    const amount = units * 0.10;

    const direction = Math.random() > 0.5 ? 1 : -1;
    const change = direction * amount;

    let newPrice = drink.price + change;

    // Keep within bounds
    if (newPrice < drink.min) newPrice = drink.min;
    if (newPrice > drink.max) newPrice = drink.max;

    // Round to 2 decimals
    newPrice = Math.round(newPrice * 100) / 100;

    drink.oldPrice = drink.price;
    drink.price = newPrice;
}

function triggerSingleCrash() {
    const drink = drinks[Math.floor(Math.random() * drinks.length)];
    crashingDrinkId = drink.id;

    crashEndTime = Date.now() + 30000;

    drink.oldPrice = drink.price;
    drink.price = drink.initialPrice * 0.5;

    marketStateEl.innerHTML = `CRASH: <span style="color: var(--accent-red)">${drink.name}</span>`;
    marketStateEl.style.color = "var(--accent-red)";

    document.body.classList.add('has-crash');

    // Play sound
    crashSound.currentTime = 0;
    crashSound.play().catch(e => console.log("Audio play failed (user interaction needed?):", e));
}

function endSingleCrash() {
    const drink = drinks.find(d => d.id === crashingDrinkId);
    if (drink) {
        drink.oldPrice = drink.price;
        // Reset near initial
        drink.price = drink.initialPrice;
        scheduleNextUpdate(drink);
    }

    crashingDrinkId = null;
    nextCrashTime = Date.now() + (Math.random() * 180000 + 120000);

    marketStateEl.innerText = "MARKET OPEN";
    marketStateEl.style.color = "var(--accent-green)";

    document.body.classList.remove('has-crash');
}

function updateTimerUI(now) {
    if (crashingDrinkId) {
        const remaining = Math.ceil((crashEndTime - now) / 1000);
        nextCrashTimerEl.innerText = `SALE ENDS: 00:${remaining < 10 ? '0' : ''}${remaining}`;
        nextCrashTimerEl.style.color = "var(--accent-red)";
    } else {
        const remaining = Math.ceil((nextCrashTime - now) / 1000);
        nextCrashTimerEl.innerText = `NEXT DROP: ${Math.floor(remaining / 60)}:${(remaining % 60) < 10 ? '0' : ''}${remaining % 60}`;
        nextCrashTimerEl.style.color = "#666";
    }
}

// Rendering
function renderGrid() {
    gridEl.innerHTML = '';

    drinks.forEach(drink => {
        const isCrashing = drink.id === crashingDrinkId;
        const card = document.createElement('div');
        card.className = `drink-card ${isCrashing ? 'crashing' : ''}`;

        const priceChange = drink.price - (drink.oldPrice || drink.price);
        const isUp = priceChange >= 0;

        const arrowIcon = isUp
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-icon up"><polyline points="18 15 12 9 6 15"></polyline></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-icon down"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

        card.innerHTML = `
            <div class="drink-info">
                <div class="drink-name">${drink.name}</div>
                <div class="drink-type">${drink.type}</div>
            </div>
            <div class="price-area">
                <div class="current-price" style="color: ${isCrashing ? '#fff' : (isUp ? 'var(--accent-green)' : 'var(--accent-red)')}">
                    €${drink.price.toFixed(2)}
                </div>
                <div class="price-change" style="color: ${isUp ? 'var(--accent-green)' : 'var(--accent-red)'}">
                    ${arrowIcon}
                    ${Math.abs(priceChange).toFixed(2)}
                </div>
            </div>
            ${isCrashing ? '<div class="crash-badge">50% OFF!</div>' : ''}
        `;

        gridEl.appendChild(card);
    });
}

function renderTicker() {
    const tickerHtml = drinks.map(drink => {
        const isUp = drink.price >= (drink.oldPrice || drink.price);
        return `<span class="ticker-item ${isUp ? 'up' : 'down'}">
            ${drink.name} <span class="price">€${drink.price.toFixed(2)}</span>
        </span>`;
    }).join('');

    const fullHtml = tickerHtml + tickerHtml + tickerHtml;
    tickerEl.innerHTML = fullHtml;
    if (tickerBottomEl) tickerBottomEl.innerHTML = fullHtml;
}

// Start
init();
