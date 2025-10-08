const select = document.getElementById("mySelect");
const cities = [
    "Adrar", "Ain Defla", "Ain Temouchent", "Algiers", "Annaba", "Batna", "Bechar", "Bejaia", "Biskra",
    "Blida", "Bouira", "Boumerdes", "Chlef", "Constantine", "Djelfa", "El Bayadh",
    "El Oued", "Ghardaia", "Guelma", "Illizi", "Jijel", "Laghouat", "Mascara", "Medea", "Mila",
    "Mostaganem", "Msila", "Oran", "Ouargla", "Relizane", "Saida", "Setif", "Skikda", "Souk Ahras",
    "Tamanrasset", "Tebessa", "Tiaret", "Tipaza", "Tizi Ouzou", "Tlemcen"
];
cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
});

const translations = {
    ar: {
        prayers: {
            Fajr: "الفجر",
            Sunrise: "الشروق",
            Dhuhr: "الظهر",
            Asr: "العصر",
            Maghrib: "المغرب",
            Isha: "العشاء"
        },
        next: "الصلاة القادمة:",
        chooseCity: " اختر مدينتك",
        langButton: "🌐 English",
        dir: "rtl",
        cityLabel: "الجزائر"
    },
    en: {
        prayers: {
            Fajr: "Fajr",
            Sunrise: "Sunrise",
            Dhuhr: "Dhuhr",
            Asr: "Asr",
            Maghrib: "Maghrib",
            Isha: "Isha"
        },
        next: "Next Prayer:",
        chooseCity: " Choose City",
        langButton: "🌐 العربية",
        dir: "ltr",
        cityLabel: "Algiers"
    }
};

let currentLang = localStorage.getItem("lang") || "ar";
let prayerData = {};
let nextPrayerTime = null;
let nextPrayerName = "";

function applyLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.body.dir = t.dir;

    document.getElementById("next-label").textContent = t.next;
    document.getElementById("city-label").textContent = t.chooseCity;
    document.getElementById("langToggle").textContent = t.langButton;

    if (Object.keys(prayerData).length > 0) renderCards(prayerData);
}

async function getTime(cityname = "Algiers") {
    try {
        const response = await axios.get("https://api.aladhan.com/v1/timingsByCity", {
            params: { city: cityname, country: "DZ", method: 19 }
        });
        const { timings, date } = response.data.data;
        prayerData = timings;
        document.querySelector("#city-name").textContent = cityname;
        document.querySelector("#date").textContent = date.readable;
        renderCards(timings);
        updateNextPrayer();
    } catch (err) {
        console.error(err);
    }
}

function renderCards(data) {
    const t = translations[currentLang];
    const container = document.getElementById("cards");
    container.innerHTML = "";

    for (const key in t.prayers) {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
      <h2>${t.prayers[key]}</h2>
      <h1>${data[key]}</h1>
    `;
        container.appendChild(card);
    }
}

setInterval(() => {
    document.getElementById("clock").textContent = new Date().toLocaleTimeString(currentLang === "ar" ? "ar-DZ" : "en-GB");
}, 1000);

function updateNextPrayer() {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let next = null;

    for (const [name, time] of Object.entries(prayerData)) {
        if (["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(name)) {
            const prayerTime = new Date(`${today}T${time}:00`);
            if (prayerTime > now) {
                next = { name, time: prayerTime };
                break;
            }
        }
    }

    if (!next) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        next = { name: "Fajr", time: new Date(`${tomorrow.toISOString().split("T")[0]}T${prayerData.Fajr}:00`) };
    }

    nextPrayerTime = next.time;
    nextPrayerName = translations[currentLang].prayers[next.name];
    document.getElementById("nextName").textContent = nextPrayerName;
    startCountdown();
}

function startCountdown() {
    setInterval(() => {
        const now = new Date();
        const diff = nextPrayerTime - now;
        if (diff <= 0) return updateNextPrayer();

        const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        document.getElementById("countdown").textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

document.getElementById("langToggle").addEventListener("click", () => {
    currentLang = currentLang === "ar" ? "en" : "ar";
    localStorage.setItem("lang", currentLang);
    applyLanguage(currentLang);
    getTime(document.getElementById("city-name").textContent);
});
select.addEventListener("change", () => {
    getTime(select.value);
    document.getElementById("city-name").textContent = select.value;
    document.querySelector("#time").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
});

function startClock() {
    setInterval(() => {
        const now = new Date();
        const formatted = now.toLocaleTimeString(currentLang === "ar" ? "ar-DZ" : "en-GB", { hour12: false });
        document.getElementById("clock").textContent = formatted;
    }, 1000);
}
startClock();

setInterval(() => {
    const cd = document.getElementById("countdown");
    cd.style.transform = "scale(1.05)";
    setTimeout(() => cd.style.transform = "scale(1)", 200);
}, 1000);

applyLanguage(currentLang);
getTime();
