  const defaultCities = [
            "Adrar", "Ain Defla", "Ain Temouchent", "Algiers", "Annaba", "Batna", "Bechar",
            "Bejaia", "Biskra", "Blida", "Bouira", "Boumerdes", "Chlef", "Constantine",
            "Djelfa", "El Bayadh", "El Oued", "Ghardaia", "Guelma", "Illizi", "Jijel",
            "Laghouat", "Mascara", "Medea", "Mila", "Mostaganem", "Msila", "Oran",
            "Ouargla", "Relizane", "Saida", "Setif", "Skikda", "Souk Ahras", "Tamanrasset",
            "Tebessa", "Tiaret", "Tipaza", "Tizi Ouzou", "Tlemcen"
        ];

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
                nextLabel: "الصلاة القادمة",
                localTime: "الوقت المحلي",
                useLocation: "استخدم موقعي",
                status_wait: "انتظار الموقع...",
                status_denied: "تم رفض الدخول لموقعك — اختر مدينة يدوياً",
                status_ok: "تم ضبط الموقع"
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
                nextLabel: "Next Prayer",
                localTime: "Local Time",
                useLocation: "Use my location",
                status_wait: "Waiting for location…",
                status_denied: "Location permission denied — choose a city",
                status_ok: "Location set"
            }
        };

        let lang = localStorage.getItem('lang') || 'ar';
        let theme = localStorage.getItem('theme') || 'dark';
        let method = localStorage.getItem('method') || '19';
        let prayerData = {};
        let countdownInterval = null;
        let clockInterval = null;
        let currentCoords = null;
        let currentCity = localStorage.getItem('city') || 'Algiers';

        const citySelect = document.getElementById('citySelect');
        const cityLine = document.getElementById('cityLine');
        const bigClock = document.getElementById('bigClock');
        const tzLabel = document.getElementById('tzLabel');
        const grid = document.getElementById('prayerGrid');
        const nextLabelEl = document.getElementById('nextLabel');
        const nextPrayerName = document.getElementById('nextPrayerName');
        const countdownEl = document.getElementById('countdown');
        const langToggle = document.getElementById('langToggle');
        const themeToggle = document.getElementById('themeToggle');
        const locBtn = document.getElementById('locBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const statusMsg = document.getElementById('statusMsg');
        const methodSelect = document.getElementById('method');

        function pad(n) {
            return String(n).padStart(2, '0');
        }

        function setLangUI() {
            document.documentElement.lang = (lang === 'ar') ? 'ar' : 'en';
            document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
            nextLabelEl.textContent = translations[lang].nextLabel;
            tzLabel.textContent = translations[lang].localTime;
            locBtn.textContent = '📍 ' + translations[lang].useLocation;
            langToggle.textContent = (lang === 'ar') ? 'EN' : 'العربية';
            document.querySelector('label[for="citySelect"]').textContent =
                (lang === 'ar') ? 'اختر مدينتك' : 'Choose city';
            statusMsg.textContent = translations[lang].status_wait;
            if (Object.keys(prayerData).length) renderGrid(prayerData);
        }

        function applyTheme() {
            if (theme === 'light') document.documentElement.classList.add('light');
            else document.documentElement.classList.remove('light');
            themeToggle.textContent = (theme === 'light') ? '☀️' : '☾';
        }

        function timeStrToDate(timeStr, offsetDays = 0) {
            const [hh, mm] = timeStr.replace(/[^0-9:]/g, '').split(':').map(Number);
            const d = new Date();
            d.setHours(hh || 0, mm || 0, 0, 0);
            if (offsetDays) d.setDate(d.getDate() + offsetDays);
            return d;
        }

        function computeNextPrayer(data) {
            const order = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
            const now = new Date();
            for (const name of order) {
                if (!data[name]) continue;
                const dt = timeStrToDate(data[name]);
                if (dt > now) return {
                    name,
                    time: dt
                };
            }
            return {
                name: "Fajr",
                time: timeStrToDate(data.Fajr, 1)
            };
        }

        function startCountdown(next) {
            if (!next) return;
            clearInterval(countdownInterval);
            nextPrayerName.textContent = translations[lang].prayers[next.name] || next.name;
            countdownInterval = setInterval(() => {
                const now = new Date();
                const diff = next.time - now;
                if (diff <= 0) {
                    clearInterval(countdownInterval);
                    loadTimings(currentCity);
                    return;
                }
                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                countdownEl.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
            }, 500);
        }

        function startClock() {
            clearInterval(clockInterval);
            clockInterval = setInterval(() => {
                const now = new Date();
                bigClock.textContent = now.toLocaleTimeString(
                    (lang === 'ar') ? 'ar-DZ' : 'en-GB', {
                        hour12: false
                    }
                );
            }, 500);
            bigClock.textContent = new Date().toLocaleTimeString(
                (lang === 'ar') ? 'ar-DZ' : 'en-GB', {
                    hour12: false
                }
            );
        }

        function renderGrid(data) {
            grid.innerHTML = '';
            const order = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
            const next = computeNextPrayer(data);
            for (const k of order) {
                const card = document.createElement('div');
                card.className = 'prayer' + ((next && k === next.name) ? ' highlight' : '');
                card.innerHTML = `<h4>${translations[lang].prayers[k] || k}</h4>
                      <div class="time">${data[k] || '--:--'}</div>`;
                grid.appendChild(card);
            }
        }

        function populateCities() {
            citySelect.innerHTML = '';
            defaultCities.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                if (c.toLowerCase() === currentCity.toLowerCase()) opt.selected = true;
                citySelect.appendChild(opt);
            });
        }

        async function reverseGeocode(lat, lon) {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
                const res = await fetch(url);
                const j = await res.json();
                const a = j.address || {};
                return a.city || a.town || a.village || a.county || a.state || "Unknown";
            } catch {
                return "Unknown";
            }
        }

        async function fetchTimingsByCoords(lat, lon, meth) {
            const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${meth}`;
            const res = await fetch(url);
            const j = await res.json();
            return j;
        }

        async function loadTimings(city) {
            try {
                let payload;
                if (currentCoords) {
                    payload = await fetchTimingsByCoords(currentCoords.lat, currentCoords.lon, method);
                } else {
                    const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=DZ&method=${method}`;
                    const res = await fetch(url);
                    payload = await res.json();
                }
                const timings = payload.data.timings;
                prayerData = timings;
                const readable = payload.data.date.readable;
                cityLine.textContent = `${city} — ${readable}`;
                renderGrid(timings);
                const next = computeNextPrayer(timings);
                startCountdown(next);
                statusMsg.textContent = translations[lang].status_ok;
            } catch (e) {
                console.error("Timings fetch failed", e);
                cityLine.textContent = `${city} — (offline mode)`;
                grid.innerHTML = "<p style='text-align:center'>⚠️ Error fetching timings</p>";
                statusMsg.textContent = translations[lang].status_denied;
            }
        }

        // ---------- Location ----------
        async function detectLocation() {
            if (!navigator.geolocation) {
                statusMsg.textContent = translations[lang].status_denied;
                await loadTimings(currentCity);
                return;
            }
            statusMsg.textContent = translations[lang].status_wait;
            navigator.geolocation.getCurrentPosition(async pos => {
                currentCoords = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                };
                currentCoords.city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                currentCity = currentCoords.city || currentCity;
                localStorage.setItem('city', currentCity);
                localStorage.setItem('coords', JSON.stringify(currentCoords));
                await loadTimings(currentCity);
            }, async() => {
                statusMsg.textContent = translations[lang].status_denied;
                await loadTimings(currentCity);
            }, {
                timeout: 10000
            });
        }

        langToggle.onclick = () => {
            lang = (lang === 'ar') ? 'en' : 'ar';
            localStorage.setItem('lang', lang);
            setLangUI();
            startClock();
        };
        themeToggle.onclick = () => {
            theme = (theme === 'light') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            applyTheme();
        };
        locBtn.onclick = detectLocation;
        refreshBtn.onclick = () => loadTimings(currentCity);
        citySelect.onchange = e => {
            currentCity = e.target.value;
            currentCoords = null;
            localStorage.setItem('city', currentCity);
            loadTimings(currentCity);
        };
        methodSelect.onchange = e => {
            method = e.target.value;
            localStorage.setItem('method', method);
            loadTimings(currentCity);
        };

        async function init() {
            methodSelect.value = method;
            setLangUI();
            applyTheme();
            populateCities();
            startClock();
            const savedCoords = localStorage.getItem('coords');
            if (savedCoords) {
                try {
                    currentCoords = JSON.parse(savedCoords);
                } catch {
                    currentCoords = null;
                }
            }
            if (currentCoords && currentCoords.lat) await loadTimings(currentCity);
            else await detectLocation();
        }
        init();
