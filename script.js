const districtOrder = ["Jinjiang", "Wuhou", "Chongqing Overnight"];

const state = {
  activeDistrict: "Jinjiang",
  hotels: [],
  restaurants: [],
  shopping: [],
  transit: [],
  chongqing24h: []
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function listMarkup(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function moneyCell(rate) {
  if (!rate || rate.availability !== "available") {
    return '<span class="unavailable">Unavailable</span>';
  }

  return `
    <div class="rate-value">${escapeHtml(rate.display_price)}</div>
    <div class="rate-basis">${escapeHtml(rate.basis)}</div>
    <div class="rate-note">${escapeHtml(rate.notes || "")}</div>
  `;
}

function roomRateTableMarkup(roomRates) {
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
      <div class="meta">Captured: ${escapeHtml(roomRates?.captured_at || "n/a")} · ${escapeHtml(roomRates?.source_name || "n/a")}</div>
      <div class="meta">${escapeHtml(roomRates?.caveat || "")}</div>
    </div>
  `;
}

function imageMarkup(hotel, kind, label) {
  const local = kind === "exterior" ? hotel.images.exterior_local : hotel.images.interior_local;
  const primary = kind === "exterior" ? hotel.images.exterior_url : hotel.images.interior_url;
  const fallback = kind === "exterior" ? hotel.images.exterior_fallback_url : hotel.images.interior_fallback_url;
  const sources = [local, primary, fallback].filter(Boolean);
  const firstSource = sources[0] || "assets/placeholders/image-unavailable.svg";

  return `
    <figure class="hotel-image">
      <img
        class="js-fallback-image"
        src="${escapeHtml(firstSource)}"
        data-sources="${escapeHtml(JSON.stringify(sources))}"
        data-placeholder-src="assets/placeholders/image-unavailable.svg"
        alt="${escapeHtml(label)} at ${escapeHtml(hotel.name)}"
        loading="lazy"
      />
      <div class="img-placeholder" hidden>Image unavailable at source.</div>
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
            <div class="links">
              <a href="${escapeHtml(hotel.links.official)}" target="_blank" rel="noopener noreferrer">Official hotel page</a>
              <a href="${escapeHtml(hotel.links.booking)}" target="_blank" rel="noopener noreferrer">Pricing source</a>
              <a href="${escapeHtml(hotel.room_rates_may_11_15_2026.source_url)}" target="_blank" rel="noopener noreferrer">Rate source detail</a>
              <a href="${escapeHtml(hotel.links.map)}" target="_blank" rel="noopener noreferrer">Map</a>
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
      <h4>Chongqing 24-Hour Mini-Itinerary</h4>
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

    let sources = [];
    try {
      sources = JSON.parse(img.dataset.sources || "[]");
    } catch (error) {
      sources = [];
    }

    const uniqueSources = Array.from(new Set(sources.filter(Boolean)));
    img.dataset.idx = "0";

    if (!uniqueSources.length) {
      img.hidden = true;
      const figure = img.closest("figure");
      const placeholder = figure?.querySelector(".img-placeholder");
      if (placeholder) {
        placeholder.hidden = false;
      }
      return;
    }

    img.addEventListener("load", () => {
      const figure = img.closest("figure");
      const placeholder = figure?.querySelector(".img-placeholder");
      if (placeholder) {
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

      const figure = img.closest("figure");
      if (!figure) {
        return;
      }

      img.hidden = true;
      const placeholder = figure.querySelector(".img-placeholder");
      if (placeholder) {
        placeholder.hidden = false;
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
    title.innerHTML = `
      <h3>${escapeHtml(district)} Section</h3>
      <span class="meta">${hotels.length} hotel option${hotels.length === 1 ? "" : "s"}</span>
    `;
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
  const tbody = document.querySelector("#restaurantTable tbody");
  tbody.innerHTML = state.restaurants
    .map(
      (r) => `
      <tr>
        <td><a href="${escapeHtml(r.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)}</a></td>
        <td>${escapeHtml(r.cuisine)}</td>
        <td>${escapeHtml(r.address)} (${escapeHtml(r.district)})</td>
        <td>${escapeHtml(r.michelin_designation)}</td>
        <td>${escapeHtml(r.price_band)}</td>
        <td>${escapeHtml(r.estimated_per_person)}</td>
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
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.district)}</td>
        <td>${escapeHtml(s.type)}</td>
        <td>${escapeHtml((s.what_to_buy || []).join(", "))}</td>
        <td>${escapeHtml(s.price_level)}</td>
        <td>${escapeHtml(s.nearest_metro)}</td>
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
        <td>${escapeHtml(t.route_name)}</td>
        <td>${escapeHtml(t.from)}</td>
        <td>${escapeHtml(t.to)}</td>
        <td>${escapeHtml(t.mode)}</td>
        <td>${escapeHtml(t.typical_time)}</td>
        <td>${escapeHtml(t.typical_cost)}</td>
        <td>${escapeHtml(t.notes)}</td>
      </tr>
    `
    )
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
    });
  });
}

async function loadData() {
  let hotels = null;
  let restaurants = null;
  let shopping = null;
  let transit = null;
  let chongqing24h = null;

  try {
    const [hotelsResponse, restaurantsResponse, shoppingResponse, transitResponse, cqResponse] = await Promise.all([
      fetch("data/hotels.json"),
      fetch("data/restaurants.json"),
      fetch("data/shopping.json"),
      fetch("data/transit.json"),
      fetch("data/chongqing_24h.json")
    ]);

    if (hotelsResponse.ok && restaurantsResponse.ok && shoppingResponse.ok && transitResponse.ok && cqResponse.ok) {
      hotels = await hotelsResponse.json();
      restaurants = await restaurantsResponse.json();
      shopping = await shoppingResponse.json();
      transit = await transitResponse.json();
      chongqing24h = await cqResponse.json();
    }
  } catch (error) {
    // `file://` mode can block local fetch calls.
  }

  if (!Array.isArray(hotels) || !Array.isArray(restaurants) || !Array.isArray(shopping) || !Array.isArray(transit) || !Array.isArray(chongqing24h)) {
    hotels = window.__CHENGDU_HOTELS__;
    restaurants = window.__CHENGDU_RESTAURANTS__;
    shopping = window.__CHENGDU_SHOPPING__;
    transit = window.__CHENGDU_TRANSIT__;
    chongqing24h = window.__CHONGQING_24H__;
  }

  if (!Array.isArray(hotels) || !Array.isArray(restaurants) || !Array.isArray(shopping) || !Array.isArray(transit) || !Array.isArray(chongqing24h)) {
    throw new Error("Failed to load travel data files.");
  }

  state.hotels = hotels;
  state.restaurants = restaurants;
  state.shopping = shopping;
  state.transit = transit;
  state.chongqing24h = chongqing24h;

  renderDistrictPanels();
  renderRestaurants();
  renderShopping();
  renderTransit();
}

function setupPrint() {
  const printBtn = document.querySelector("#printBtn");
  printBtn.addEventListener("click", () => window.print());
}

(async function init() {
  try {
    setupTabs();
    setupPrint();
    await loadData();
  } catch (error) {
    const districts = document.querySelector("#districtPanels");
    districts.innerHTML = `<p>Unable to load guide data. ${escapeHtml(error.message)}</p>`;
    console.error(error);
  }
})();
