const districtOrder = ["Jinjiang", "Wuhou", "Chongqing Overnight"];
const DATA_VERSION = "20260301f";

const state = {
  activeDistrict: "Jinjiang",
  hotels: [],
  restaurants: [],
  shopping: [],
  transit: [],
  chongqing24h: [],
  chinaTips: []
};

const INLINE_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="Image unavailable">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7a1d27"/>
      <stop offset="100%" stop-color="#1f4d43"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <text x="600" y="380" text-anchor="middle" fill="#f7e0a4" font-family="Georgia, serif" font-size="64">Hotel Image Unavailable</text>
  <text x="600" y="450" text-anchor="middle" fill="#f7e0a4" font-family="Arial, sans-serif" font-size="36">Fallback placeholder loaded</text>
</svg>
`)}`;

const tipCategoryLabel = {
  apps: "Apps",
  payments: "Payments",
  connectivity_vpn: "Connectivity + VPN Reality",
  transport: "Transport",
  food_booking: "Food Booking",
  culture_etiquette: "Culture + Etiquette",
  safety_emergency: "Safety + Emergency",
  first_48_hours: "First 48 Hours"
};

function normalizeSource(path) {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/")) {
    return path;
  }

  const clean = path.replace(/^\.?\//, "");

  if (window.location.hostname.endsWith("github.io")) {
    const repoSegment = (window.location.pathname.split("/").filter(Boolean)[0] || "").trim();
    if (repoSegment) {
      return `/${repoSegment}/${clean}`;
    }
  }

  return `./${clean}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function listMarkup(items) {
  return `<ul>${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function trustChip(status) {
  const normalized = ["verified", "estimated", "inferred"].includes(status) ? status : "estimated";
  const label = normalized[0].toUpperCase() + normalized.slice(1);
  return `<span class="trust-chip ${normalized}">${label}</span>`;
}

function moneyCell(rate) {
  if (!rate || rate.availability !== "available") {
    return '<span class="unavailable">Unavailable</span>';
  }

  return `
    <div class="rate-value">${escapeHtml(rate.display_price)}</div>
    <div class="rate-basis">${escapeHtml(rate.basis || "")}</div>
    <div class="rate-note">${escapeHtml(rate.notes || "")}</div>
    <div class="rate-note">${trustChip(rate.verification_status)}</div>
  `;
}

function roomRateTableMarkup(roomRates) {
  const fx = roomRates?.fx;
  const fxNote = fx
    ? `<div class="rate-source-note">FX reference: ${escapeHtml(fx.from_currency)}→${escapeHtml(
        fx.to_currency
      )} ${escapeHtml(fx.rate)} on ${escapeHtml(fx.rate_date)} (${escapeHtml(fx.source_name)}).</div>`
    : "";

  return `
    <div class="rate-matrix-wrap">
      <table class="rate-matrix" aria-label="Room rate matrix">
        <thead>
          <tr>
            <th>Room Type</th>
            <th>Refundable</th>
            <th>Non-refundable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>One bed</td>
            <td>${moneyCell(roomRates?.one_bed?.refundable)}</td>
            <td>${moneyCell(roomRates?.one_bed?.non_refundable)}</td>
          </tr>
          <tr>
            <td>Two beds</td>
            <td>${moneyCell(roomRates?.two_bed?.refundable)}</td>
            <td>${moneyCell(roomRates?.two_bed?.non_refundable)}</td>
          </tr>
        </tbody>
      </table>
      <div class="meta">Display currency: ${escapeHtml(roomRates?.display_currency || roomRates?.currency || "USD")} · Rate quality: ${escapeHtml(
        roomRates?.rate_quality || "estimated"
      )}</div>
      <div class="meta">Captured: ${escapeHtml(roomRates?.captured_at || "n/a")} · ${escapeHtml(roomRates?.source_name || "n/a")}</div>
      <div class="meta">${escapeHtml(roomRates?.caveat || "")}</div>
      ${fxNote}
    </div>
  `;
}

function imageMarkup(hotel, kind, label) {
  const local = normalizeSource(kind === "exterior" ? hotel.images?.exterior_local : hotel.images?.interior_local);
  const primary = normalizeSource(kind === "exterior" ? hotel.images?.exterior_url : hotel.images?.interior_url);
  const fallback = normalizeSource(kind === "exterior" ? hotel.images?.exterior_fallback_url : hotel.images?.interior_fallback_url);
  const placeholder = INLINE_PLACEHOLDER_SVG;
  const firstSource = local || primary || fallback || placeholder;

  return `
    <figure class="hotel-image">
      <img
        class="js-fallback-image"
        src="${escapeHtml(firstSource)}"
        data-local-src="${escapeHtml(local)}"
        data-primary-src="${escapeHtml(primary)}"
        data-fallback-src="${escapeHtml(fallback)}"
        data-placeholder-src="${escapeHtml(placeholder)}"
        alt="${escapeHtml(label)} at ${escapeHtml(hotel.name)}"
        loading="lazy"
      />
      <div class="img-placeholder" hidden style="display:none;">Image unavailable at source.</div>
      <figcaption>${escapeHtml(label)}</figcaption>
    </figure>
  `;
}

function hotelCardMarkup(hotel) {
  const outsideBadge = hotel.outside_primary_district
    ? `<span class="badge outside">Outside primary section (${escapeHtml(hotel.district)})</span>`
    : "";

  return `
    <article class="hotel-card" id="${escapeHtml(hotel.id)}">
      <div class="hotel-title-row">
        <h3 class="hotel-name">${escapeHtml(hotel.name)}</h3>
        <div class="meta">${escapeHtml(hotel.brand)} · ${escapeHtml(hotel.star_category)} · ${escapeHtml(hotel.city)}</div>
      </div>

      <div class="badges">
        <span class="badge district">District: ${escapeHtml(hotel.district)}</span>
        ${outsideBadge}
        ${trustChip(hotel.verification_status)}
      </div>

      <div class="hotel-grid">
        <div class="images">
          ${imageMarkup(hotel, "exterior", "Exterior")}
          ${imageMarkup(hotel, "interior", "Interior room")}
        </div>

        <div class="content">
          <p>${escapeHtml(hotel.neighborhood_summary)}</p>

          <div class="price-block">
            <strong>May 11-15, 2026 Room Pricing</strong>
            ${roomRateTableMarkup(hotel.room_rates_may_11_15_2026)}
          </div>

          <div class="list-pair">
            <div>
              <h4>Local attractions</h4>
              ${listMarkup(hotel.local_attractions)}
            </div>
            <div>
              <h4>Nearby restaurant ideas</h4>
              ${listMarkup(hotel.nearby_restaurants)}
            </div>
          </div>

          <details>
            <summary>More info and booking links</summary>
            <div class="meta">Source captured: ${escapeHtml(hotel.captured_at || "n/a")} · ${escapeHtml(hotel.verification_note || "")}</div>
            <div class="links">
              <a href="${escapeHtml(hotel.links?.official || "#")}" target="_blank" rel="noopener noreferrer">Official hotel page</a>
              <a href="${escapeHtml(hotel.links?.booking || "#")}" target="_blank" rel="noopener noreferrer">Pricing source</a>
              <a href="${escapeHtml(hotel.room_rates_may_11_15_2026?.source_url || hotel.source_url || "#")}" target="_blank" rel="noopener noreferrer">Rate source detail</a>
              <a href="${escapeHtml(hotel.links?.map || "#")}" target="_blank" rel="noopener noreferrer">Map</a>
            </div>
          </details>
        </div>
      </div>
    </article>
  `;
}

function chongqingMiniItineraryMarkup() {
  if (!state.chongqing24h.length) {
    return "";
  }

  const rows = state.chongqing24h
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.time_block)}</td>
        <td>${escapeHtml(item.activity)}</td>
        <td>${escapeHtml(item.area)}</td>
        <td>${escapeHtml(item.food_tip)}</td>
        <td>${escapeHtml(item.notes)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <section class="mini-itinerary">
      <h4>Chongqing 24-Hour Mini-Itinerary ${trustChip("inferred")}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time Block</th>
              <th>Activity</th>
              <th>Area</th>
              <th>Food Tip</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function bindImageFallbacks(root = document) {
  root.querySelectorAll(".js-fallback-image").forEach((img) => {
    if (img.dataset.bound === "1") {
      return;
    }
    img.dataset.bound = "1";

    const uniqueSources = Array.from(
      new Set([img.dataset.localSrc, img.dataset.primarySrc, img.dataset.fallbackSrc, img.dataset.placeholderSrc].filter(Boolean))
    );

    img.dataset.idx = "0";

    if (!uniqueSources.length) {
      img.hidden = true;
      const figure = img.closest("figure");
      const placeholder = figure?.querySelector(".img-placeholder");
      if (placeholder) {
        placeholder.style.display = "grid";
        placeholder.hidden = false;
      }
      return;
    }

    img.addEventListener("load", () => {
      const figure = img.closest("figure");
      const placeholder = figure?.querySelector(".img-placeholder");
      if (placeholder) {
        placeholder.style.display = "none";
        placeholder.hidden = true;
      }
      img.hidden = false;
    });

    img.addEventListener("error", () => {
      const currentIdx = Number(img.dataset.idx || "0");
      const nextIdx = currentIdx + 1;

      if (nextIdx < uniqueSources.length) {
        img.dataset.idx = String(nextIdx);
        img.src = uniqueSources[nextIdx];
        return;
      }

      const placeholderSrc = img.dataset.placeholderSrc || INLINE_PLACEHOLDER_SVG;
      if (img.src !== placeholderSrc) {
        img.src = placeholderSrc;
        return;
      }

      const figure = img.closest("figure");
      if (figure) {
        const placeholder = figure.querySelector(".img-placeholder");
        if (placeholder) {
          placeholder.style.display = "grid";
          placeholder.hidden = false;
        }
      }
    });
  });
}

function renderDistrictPanels() {
  const container = document.querySelector("#districtPanels");
  container.innerHTML = "";

  districtOrder.forEach((district) => {
    const hotels = state.hotels.filter((hotel) => hotel.primary_section === district);
    const panel = document.createElement("section");
    panel.className = `district-panel ${state.activeDistrict === district ? "active" : ""}`;
    panel.dataset.district = district;

    const title = document.createElement("div");
    title.className = "panel-header";
    title.innerHTML = `<h3>${escapeHtml(district)} Section</h3><span class="meta">${hotels.length} hotel option${
      hotels.length === 1 ? "" : "s"
    }</span>`;
    panel.appendChild(title);

    if (!hotels.length) {
      const empty = document.createElement("p");
      empty.textContent = "No hotels in this section yet.";
      panel.appendChild(empty);
      container.appendChild(panel);
      return;
    }

    hotels.forEach((hotel, index) => {
      panel.insertAdjacentHTML("beforeend", hotelCardMarkup(hotel));
      if (index !== hotels.length - 1) {
        panel.insertAdjacentHTML("beforeend", '<hr class="hotel-separator" />');
      }
    });

    if (district === "Chongqing Overnight") {
      panel.insertAdjacentHTML("beforeend", chongqingMiniItineraryMarkup());
    }

    container.appendChild(panel);
  });

  bindImageFallbacks(container);
}

function renderRestaurants() {
  const city = state.activeDistrict === "Chongqing Overnight" ? "Chongqing" : "Chengdu";
  const heading = document.querySelector("#restaurantsHeading");
  const subhead = document.querySelector("#restaurantsSubhead");
  const tbody = document.querySelector("#restaurantTable tbody");

  let restaurants = state.restaurants.filter((r) => (r.city || "").toLowerCase() === city.toLowerCase());
  if (!restaurants.length) {
    restaurants = state.restaurants;
  }

  if (heading) {
    heading.textContent = city === "Chongqing" ? "Chongqing Restaurant Picks" : "Michelin Guide Restaurant Picks";
  }
  if (subhead) {
    subhead.textContent =
      city === "Chongqing"
        ? "Sourced local Chongqing picks for overnight stays."
        : "Includes cuisine, district, Michelin status, trust label, and budget guidance.";
  }

  tbody.innerHTML = restaurants
    .map(
      (r) => `
      <tr>
        <td><a href="${escapeHtml(r.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)}</a></td>
        <td>${escapeHtml(r.cuisine)}</td>
        <td>${escapeHtml(r.address)} (${escapeHtml(r.district)})</td>
        <td>${escapeHtml(r.michelin_designation)}</td>
        <td>${escapeHtml(r.price_band)}</td>
        <td>${escapeHtml(r.estimated_per_person)}</td>
        <td>${trustChip(r.verification_status)}</td>
      </tr>
    `
    )
    .join("");
}

function renderShopping() {
  const tbody = document.querySelector("#shoppingTable tbody");
  tbody.innerHTML = state.shopping
    .map(
      (s) => `
      <tr>
        <td><a href="${escapeHtml(s.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.name)}</a></td>
        <td>${escapeHtml(s.district)}</td>
        <td>${escapeHtml(s.type)}</td>
        <td>${escapeHtml((s.what_to_buy || []).join(", "))}</td>
        <td>${escapeHtml(s.price_level)}</td>
        <td>${escapeHtml(s.nearest_metro)}</td>
        <td>${trustChip(s.verification_status)}</td>
      </tr>
    `
    )
    .join("");
}

function renderTransit() {
  const tbody = document.querySelector("#transitTable tbody");
  tbody.innerHTML = state.transit
    .map(
      (t) => `
      <tr>
        <td><a href="${escapeHtml(t.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.route_name)}</a></td>
        <td>${escapeHtml(t.from)}</td>
        <td>${escapeHtml(t.to)}</td>
        <td>${escapeHtml(t.mode)}</td>
        <td>${escapeHtml(t.typical_time)}</td>
        <td>${escapeHtml(t.typical_cost)}</td>
        <td>${escapeHtml(t.notes)}</td>
        <td>${trustChip(t.verification_status)}</td>
      </tr>
    `
    )
    .join("");
}

function renderChinaTips() {
  const container = document.querySelector("#chinaTipsGroups");
  if (!container) {
    return;
  }

  const groups = state.chinaTips.reduce((acc, item) => {
    const key = item.category || "misc";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
  const orderedKeys = Object.keys(tipCategoryLabel).filter((key) => groups[key]);

  container.innerHTML = orderedKeys
    .map((key) => {
      const tips = groups[key] || [];
      const cards = tips
        .map(
          (tip) => `
          <article class="tip-card">
            <div class="tip-head">
              <h4>${escapeHtml(tip.title)}</h4>
              ${trustChip(tip.verification_status)}
            </div>
            <p>${escapeHtml(tip.description)}</p>
            ${listMarkup(tip.steps || [])}
            <div class="tip-meta">
              <a href="${escapeHtml(tip.source_url)}" target="_blank" rel="noopener noreferrer">Source</a>
              · Captured ${escapeHtml(tip.captured_at || "n/a")}
              · ${escapeHtml(tip.verification_note || "")}
            </div>
          </article>
        `
        )
        .join("");

      return `
      <section class="tip-group">
        <h3>${escapeHtml(tipCategoryLabel[key] || key)}</h3>
        <div class="tip-list">${cards}</div>
      </section>
      `;
    })
    .join("");
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll(".tab-btn"));
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDistrict = button.dataset.district;
      buttons.forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
      });
      renderDistrictPanels();
      renderRestaurants();
    });
  });
}

async function loadData() {
  let hotels = null;
  let restaurants = null;
  let shopping = null;
  let transit = null;
  let chongqing24h = null;
  let chinaTips = null;

  try {
    const responses = await Promise.all([
      fetch(`data/hotels.json?v=${DATA_VERSION}`),
      fetch(`data/restaurants.json?v=${DATA_VERSION}`),
      fetch(`data/shopping.json?v=${DATA_VERSION}`),
      fetch(`data/transit.json?v=${DATA_VERSION}`),
      fetch(`data/chongqing_24h.json?v=${DATA_VERSION}`),
      fetch(`data/china_tips.json?v=${DATA_VERSION}`)
    ]);

    if (responses.every((response) => response.ok)) {
      [hotels, restaurants, shopping, transit, chongqing24h, chinaTips] = await Promise.all(
        responses.map((response) => response.json())
      );
    }
  } catch (_error) {
    // file:// mode may block fetch
  }

  if (
    !Array.isArray(hotels) ||
    !Array.isArray(restaurants) ||
    !Array.isArray(shopping) ||
    !Array.isArray(transit) ||
    !Array.isArray(chongqing24h) ||
    !Array.isArray(chinaTips)
  ) {
    hotels = window.__CHENGDU_HOTELS__;
    restaurants = window.__CHENGDU_RESTAURANTS__;
    shopping = window.__CHENGDU_SHOPPING__;
    transit = window.__CHENGDU_TRANSIT__;
    chongqing24h = window.__CHONGQING_24H__;
    chinaTips = window.__CHINA_TIPS__;
  }

  if (
    !Array.isArray(hotels) ||
    !Array.isArray(restaurants) ||
    !Array.isArray(shopping) ||
    !Array.isArray(transit) ||
    !Array.isArray(chongqing24h) ||
    !Array.isArray(chinaTips)
  ) {
    throw new Error("Failed to load travel data files.");
  }

  state.hotels = hotels;
  state.restaurants = restaurants;
  state.shopping = shopping;
  state.transit = transit;
  state.chongqing24h = chongqing24h;
  state.chinaTips = chinaTips;

  renderDistrictPanels();
  renderRestaurants();
  renderShopping();
  renderTransit();
  renderChinaTips();
}

function setupPrint() {
  const printBtn = document.querySelector("#printBtn");
  if (!printBtn) {
    return;
  }
  printBtn.addEventListener("click", () => window.print());
}

function setupSnake() {
  const canvas = document.querySelector("#snakeCanvas");
  const scoreEl = document.querySelector("#snakeScore");
  const highScoreEl = document.querySelector("#snakeHighScore");
  const startBtn = document.querySelector("#snakeStartBtn");
  const pauseBtn = document.querySelector("#snakePauseBtn");
  const restartBtn = document.querySelector("#snakeRestartBtn");

  if (!canvas || !scoreEl || !highScoreEl || !startBtn || !pauseBtn || !restartBtn) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const size = 18;
  const cell = canvas.width / size;

  const snake = {
    body: [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 }
    ],
    dir: "right",
    nextDir: "right"
  };

  let food = { x: 12, y: 8 };
  let running = false;
  let paused = false;
  let score = 0;
  let tickTimer = null;
  let highScore = Number(localStorage.getItem("silk-snake-high-score") || "0");

  highScoreEl.textContent = String(highScore);

  function directionFromKey(key) {
    if (["ArrowUp", "w", "W"].includes(key)) return "up";
    if (["ArrowDown", "s", "S"].includes(key)) return "down";
    if (["ArrowLeft", "a", "A"].includes(key)) return "left";
    if (["ArrowRight", "d", "D"].includes(key)) return "right";
    return null;
  }

  function isOpposite(a, b) {
    return (
      (a === "up" && b === "down") ||
      (a === "down" && b === "up") ||
      (a === "left" && b === "right") ||
      (a === "right" && b === "left")
    );
  }

  function setDirection(next) {
    if (!next || isOpposite(snake.dir, next)) {
      return;
    }
    snake.nextDir = next;
  }

  function placeFood() {
    let x = 0;
    let y = 0;
    let conflict = true;
    while (conflict) {
      x = Math.floor(Math.random() * size);
      y = Math.floor(Math.random() * size);
      conflict = snake.body.some((segment) => segment.x === x && segment.y === y);
    }
    food = { x, y };
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(159, 20, 33, 0.10)";
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * cell, j * cell, cell, cell);
        }
      }
    }

    ctx.fillStyle = "#cc1f2a";
    ctx.beginPath();
    ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();

    snake.body.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#1b6f5f" : "#145748";
      ctx.fillRect(segment.x * cell + 1, segment.y * cell + 1, cell - 2, cell - 2);
    });
  }

  function stopGame() {
    running = false;
    paused = false;
    if (tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function gameOver() {
    stopGame();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("silk-snake-high-score", String(highScore));
      highScoreEl.textContent = String(highScore);
    }
  }

  function tick() {
    if (!running || paused) {
      return;
    }

    snake.dir = snake.nextDir;
    const head = { ...snake.body[0] };

    if (snake.dir === "up") head.y -= 1;
    if (snake.dir === "down") head.y += 1;
    if (snake.dir === "left") head.x -= 1;
    if (snake.dir === "right") head.x += 1;

    const hitWall = head.x < 0 || head.x >= size || head.y < 0 || head.y >= size;
    const hitBody = snake.body.some((segment) => segment.x === head.x && segment.y === head.y);

    if (hitWall || hitBody) {
      gameOver();
      drawBoard();
      return;
    }

    snake.body.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      placeFood();
    } else {
      snake.body.pop();
    }

    drawBoard();
  }

  function reset() {
    snake.body = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 }
    ];
    snake.dir = "right";
    snake.nextDir = "right";
    score = 0;
    scoreEl.textContent = "0";
    placeFood();
    drawBoard();
  }

  function start() {
    if (running) {
      paused = false;
      return;
    }
    running = true;
    paused = false;
    if (tickTimer) {
      window.clearInterval(tickTimer);
    }
    tickTimer = window.setInterval(tick, 120);
  }

  function togglePause() {
    if (!running) {
      return;
    }
    paused = !paused;
  }

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", () => {
    stopGame();
    reset();
    start();
  });

  document.addEventListener("keydown", (event) => {
    const dir = directionFromKey(event.key);
    if (!dir) {
      return;
    }
    event.preventDefault();
    setDirection(dir);
    if (!running) {
      start();
    }
  });

  document.querySelectorAll(".dpad-btn").forEach((button) => {
    const handler = (event) => {
      event.preventDefault();
      setDirection(button.dataset.dir);
      if (!running) {
        start();
      }
    };
    button.addEventListener("click", handler);
    button.addEventListener("touchstart", handler, { passive: false });
  });

  reset();
}

(function init() {
  setupTabs();
  setupPrint();
  setupSnake();
  loadData().catch((error) => {
    const districts = document.querySelector("#districtPanels");
    if (districts) {
      districts.innerHTML = `<p>Unable to load guide data. ${escapeHtml(error.message)}</p>`;
    }
    console.error(error);
  });
})();
