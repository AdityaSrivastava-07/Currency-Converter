const BASE_URL = "https://latest.currency-api.pages.dev/v1/currencies";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");
const toggle = document.querySelector(".toggle");
const amountInput = document.querySelector("#amount");

// 🌙 DARK MODE (WITH SAVE)
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggle.innerText = "☀️";
} else {
  toggle.innerText = "🌙";
}

toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    toggle.innerText = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    toggle.innerText = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// 📥 POPULATE DROPDOWNS
Array.from(dropdowns).forEach(select => {
  Object.keys(countryList).forEach(currCode => {
    let option = document.createElement("option");
    option.value = currCode;
    option.innerText = currCode;

    if (select.name === "from" && currCode === "USD") {
      option.selected = true;
    } else if (select.name === "to" && currCode === "INR") {
      option.selected = true;
    }

    select.appendChild(option);
  });

  select.addEventListener("change", (e) => {
    updateFlag(e.target);
  });
});

// 💱 EXCHANGE RATE LOGIC
const updateExchangeRate = async () => {
  let amtVal = amountInput.value || 1;
// Clear default value on focus
amountInput.addEventListener("focus", () => {
  if (amountInput.value === "1") {
    amountInput.value = "";
  }
});

// Restore if empty on blur
amountInput.addEventListener("blur", () => {
  if (amountInput.value === "") {
    amountInput.value = "1";
  }
});

  msg.innerText = "Fetching latest rate...";

  try {
    const URL = `${BASE_URL}/${fromCurr.value.toLowerCase()}.json`;

    let response = await fetch(URL);

    if (!response.ok) {
      throw new Error("API error");
    }

    let data = await response.json();

    let from = fromCurr.value.toLowerCase();
    let to = toCurr.value.toLowerCase();

    let rate = data[from][to];

    if (!rate) {
      msg.innerText = "Conversion not available ❌";
      return;
    }

    let finalAmount = (amtVal * rate).toFixed(2);

    msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;

    // Update Quick Rates state
    const baseObj = data[from];
    if (baseObj) {
      currentRatesArray = Object.keys(countryList).map(code => {
        let codeLower = code.toLowerCase();
        return {
          currCode: code,
          rate: baseObj[codeLower] || 0
        };
      }).filter(item => item.rate > 0);

      document.querySelector("#base-currency-label").innerText = fromCurr.value.toUpperCase();
      renderRatesList();
    }
  } catch (error) {
    console.error(error);
    msg.innerText = "Network/API error ⚠️";
  }
};

// 🏳️ FLAG UPDATE
const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode];

  if (!countryCode) return;

  let img = element.parentElement.querySelector("img");
  img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
};

// 🔘 BUTTON CLICK
btn.addEventListener("click", (e) => {
  e.preventDefault();
  updateExchangeRate();
});

// ⚡ AUTO UPDATE
fromCurr.addEventListener("change", updateExchangeRate);
toCurr.addEventListener("change", updateExchangeRate);
amountInput.addEventListener("input", updateExchangeRate);

// 🔄 SWAP FUNCTION
const swapBtn = document.querySelector(".dropdown i");

swapBtn.addEventListener("click", () => {
  let temp = fromCurr.value;
  fromCurr.value = toCurr.value;
  toCurr.value = temp;

  updateFlag(fromCurr);
  updateFlag(toCurr);
  updateExchangeRate();
});

// 🚀 INITIAL LOAD
window.addEventListener("load", updateExchangeRate);

// =========================
// 📊 RATES LIST FEATURES
// =========================
let currentRatesArray = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

const renderRatesList = () => {
  const searchTerm = document.querySelector("#search-rate").value.toLowerCase();
  const sortKey = document.querySelector("#sort-rate").value;
  const filterKey = document.querySelector("#filter-rate").value;

  // 🔍 ARRAY HOF: filter
  let processedRates = currentRatesArray.filter(item => {
    const matchesSearch = item.currCode.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterKey === "gt1") return item.rate > 1;
    if (filterKey === "lt1") return item.rate < 1;
    if (filterKey === "fav") return favorites.includes(item.currCode);
    return true; // Default "all"
  });

  // 📝 ARRAY HOF: sort
  processedRates.sort((a, b) => {
    if (sortKey === "asc") return a.currCode.localeCompare(b.currCode);
    if (sortKey === "desc") return b.currCode.localeCompare(a.currCode);
    if (sortKey === "low") return a.rate - b.rate;
    if (sortKey === "high") return b.rate - a.rate;
    return 0;
  });

  const listEl = document.querySelector("#rates-list");
  listEl.innerHTML = "";

  // 🎨 ARRAY HOF: forEach mapped rendering
  processedRates.forEach(item => {
    let li = document.createElement("li");
    li.className = "rate-item";
    let countryCode = countryList[item.currCode];
    let imgSrc = countryCode ? `https://flagsapi.com/${countryCode}/flat/64.png` : "";
    let isFav = favorites.includes(item.currCode);

    li.innerHTML = `
      <div class="rate-info">
        ${imgSrc ? `<img src="${imgSrc}">` : ""}
        <span>${item.currCode}</span>
      </div>
      <div class="rate-value">
        ${item.rate.toFixed(4)}
        <button class="fav-btn ${isFav ? 'active' : ''}" data-code="${item.currCode}">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
      </div>
    `;
    listEl.appendChild(li);
  });

  // 🔘 Button Interaction (Favorites)
  Array.from(listEl.querySelectorAll('.fav-btn')).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-code');
      if (favorites.includes(code)) {
        // ARRAY HOF: filter
        favorites = favorites.filter(fav => fav !== code);
      } else {
        favorites = [...favorites, code];
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
      renderRatesList();
    });
  });
};

document.querySelector("#search-rate").addEventListener("input", renderRatesList);
document.querySelector("#sort-rate").addEventListener("change", renderRatesList);
document.querySelector("#filter-rate").addEventListener("change", renderRatesList);