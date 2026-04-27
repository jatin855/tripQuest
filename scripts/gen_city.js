// This script generates views/city.ejs from the user's original code
// with fixes: Home button, Plan Trip→chatbot, /explore routes, /api/weather
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'views', 'city.ejs');

// Read current city.ejs
let content = fs.readFileSync(target, 'utf8');

// Fix 1: Replace explore.ejs references with /explore
content = content.replace(/href="explore\.ejs"/g, 'href="/explore"');
content = content.replace(/href="explore\.ejs\?/g, 'href="/explore?');

// Fix 2: Replace city.ejs references with /city
content = content.replace(/href="city\.ejs\?/g, 'href="/city?');

// Fix 3: Add Home button to nav and make Plan Trip go to chatbot
content = content.replace(
  `<li><a href="#" class="nav-cta">Plan Trip</a></li>`,
  `<li><a href="/home">Home</a></li>
    <li><a href="/home#chatbot" class="nav-cta" onclick="localStorage.setItem('openChatbot','1')">Plan Trip</a></li>`
);

// Fix 4: Replace weather fetch to use /api/weather proxy
const oldWeatherFn = `async function fetchWeather(city) {
  const DEMO = { temp:18, feels:16, cond:'Partly cloudy', humidity:55, wind:'12 km/h', icon:'⛅', live:false };
  if (!CONFIG.WEATHER_API_KEY || CONFIG.WEATHER_API_KEY === 'YOUR_OPENWEATHERMAP_KEY_HERE') return DEMO;
  try {
    const res = await fetch(\`https://api.openweathermap.org/data/2.5/weather?lat=\${city.lat}&lon=\${city.lon}&appid=\${CONFIG.WEATHER_API_KEY}&units=metric\`);
    if (!res.ok) throw new Error('api');
    const d = await res.json();
    return {
      temp:     Math.round(d.main.temp),
      feels:    Math.round(d.main.feels_like),
      cond:     d.weather[0].description,
      humidity: d.main.humidity,
      wind:     Math.round(d.wind.speed * 3.6) + ' km/h',
      icon:     weatherIcon(d.weather[0].id),
      live:     true
    };
  } catch { return DEMO; }
}`;

const newWeatherFn = `async function fetchWeather(city) {
  const DEMO = { temp:18, feels:16, cond:'Partly cloudy', humidity:55, wind:'12 km/h', icon:'⛅', live:false };
  try {
    const res = await fetch('/api/weather?city=' + encodeURIComponent(city.name));
    if (!res.ok) throw new Error('api');
    const d = await res.json();
    return {
      temp:     Math.round(d.temp_c),
      feels:    Math.round(d.feels_like),
      cond:     d.condition,
      humidity: d.humidity,
      wind:     Math.round(d.wind_kph) + ' km/h',
      icon:     d.icon ? '' : '⛅',
      iconUrl:  d.icon || null,
      live:     true
    };
  } catch { return DEMO; }
}`;

content = content.replace(oldWeatherFn, newWeatherFn);

// Fix 5: Update weather icon rendering to support image URL
content = content.replace(
  `document.getElementById('wIcon').textContent     = data.icon;`,
  `if (data.iconUrl) { document.getElementById('wIcon').innerHTML = '<img src=\"' + data.iconUrl + '\" width=\"40\" height=\"40\" alt=\"weather\">'; } else { document.getElementById('wIcon').textContent = data.icon; }`
);

// Fix 6: Fix the back URL references
content = content.replace(
  /const backUrl = `explore\.ejs\?state=\$\{stateId\}`/g,
  "const backUrl = `/explore/${stateId}`"
);

// Fix 7: Fix footer city links  
content = content.replace(
  /href="city\.ejs\?state=\$\{stateId\}&id=\$\{c\.id\}"/g,
  'href="/city?state=${stateId}&id=${c.id}"'
);

// Fix 8: Fix backUrl in error states
content = content.replace(
  /href="explore\.ejs"/g,
  'href="/explore"'
);

// Fix 9: Remove CONFIG line since we use proxy now  
content = content.replace(
  "const CONFIG = { WEATHER_API_KEY: 'YOUR_OPENWEATHERMAP_KEY_HERE' };",
  "// Weather fetched via /api/weather proxy"
);

fs.writeFileSync(target, content, 'utf8');
console.log('✅ city.ejs updated successfully!');
console.log('Changes applied:');
console.log('  - Added Home button to nav');
console.log('  - Plan Trip now opens chatbot on home page');
console.log('  - Fixed explore.ejs → /explore routes');
console.log('  - Fixed city.ejs → /city routes');
console.log('  - Weather now uses /api/weather proxy');
