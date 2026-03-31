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
for (let select of dropdowns) {
  for (let currCode in countryList) {
    let option = document.createElement("option");
    option.value = currCode;
    option.innerText = currCode;

    if (select.name === "from" && currCode === "USD") {
      option.selected = true;
    } else if (select.name === "to" && currCode === "INR") {
      option.selected = true;
    }

    select.appendChild(option);
  }

  select.addEventListener("change", (e) => {
    updateFlag(e.target);
  });
}

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