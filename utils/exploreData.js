const fs = require('fs');
const path = require('path');

// ─── STATE REGISTRY ───────────────────────────────────────────
const STATES = [
  { id:'andhra-pradesh',   file:'andhra_pradesh_cities.json',   name:'Andhra Pradesh',   tagline:'Temples, beaches, and rich Telugu culture',       emoji:'🏖️', region:'South India',      image:'https://images.unsplash.com/photo-1590766940554-634680e08fa0?w=800&q=80', type:'state' },
  { id:'arunachal-pradesh',file:'arunachal_pradesh_cities.json',name:'Arunachal Pradesh',tagline:'Land of dawn-lit mountains and monasteries',      emoji:'🏔️', region:'North-East India', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', type:'state' },
  { id:'assam',            file:'assam_cities.json',            name:'Assam',            tagline:'Tea gardens, rivers, and wild beauty',            emoji:'🍃', region:'North-East India', image:'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&q=80', type:'state' },
  { id:'bihar',            file:'bihar_cities.json',            name:'Bihar',            tagline:'Ancient heritage and spiritual significance',     emoji:'🛕', region:'East India',       image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80', type:'state' },
  { id:'chhattisgarh',     file:'chhattisgarh_cities.json',     name:'Chhattisgarh',     tagline:'Forests, waterfalls, and tribal traditions',      emoji:'🌿', region:'Central India',    image:'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', type:'state' },
  { id:'goa',              file:'goa_cities.json',              name:'Goa',              tagline:'Beaches, nightlife, and Portuguese charm',        emoji:'🌊', region:'West India',       image:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', type:'state' },
  { id:'gujarat',          file:'gujarat_cities.json',          name:'Gujarat',          tagline:'White deserts, lions, and vibrant traditions',    emoji:'🦁', region:'West India',       image:'https://images.unsplash.com/photo-1609948543911-7e88a3283080?w=800&q=80', type:'state' },
  { id:'haryana',          file:'haryana_cities.json',          name:'Haryana',          tagline:'Fields, forts, and modern growth',                emoji:'🌾', region:'North India',      image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', type:'state' },
  { id:'himachal-pradesh', file:'himachal_pradesh_cities.json', name:'Himachal Pradesh', tagline:'Snowy peaks, valleys, and hill stations',         emoji:'🏔️', region:'North India',      image:'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?w=800&q=80', type:'state' },
  { id:'jharkhand',        file:'jharkhand_cities.json',        name:'Jharkhand',        tagline:'Waterfalls, forests, and tribal heritage',        emoji:'🌲', region:'East India',       image:'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', type:'state' },
  { id:'karnataka',        file:'karnataka_cities.json',        name:'Karnataka',        tagline:'Palaces, coffee hills, and tech cities',          emoji:'☕', region:'South India',      image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', type:'state' },
  { id:'kerala',           file:'kerala_cities.json',           name:'Kerala',           tagline:'Backwaters, greenery, and coastal serenity',      emoji:'🌴', region:'South India',      image:'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80', type:'state' },
  { id:'madhya-pradesh',   file:'madhya_pradesh_cities.json',   name:'Madhya Pradesh',   tagline:'Heart of India with forts and wildlife',          emoji:'🐅', region:'Central India',    image:'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80', type:'state' },
  { id:'maharashtra',      file:'maharashtra_cities.json',      name:'Maharashtra',      tagline:'Caves, coastlines, and bustling cities',          emoji:'🏙️', region:'West India',       image:'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80', type:'state' },
  { id:'manipur',          file:'manipur_cities.json',          name:'Manipur',          tagline:'Lakes, hills, and rich cultural heritage',        emoji:'🌺', region:'North-East India', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', type:'state' },
  { id:'meghalaya',        file:'meghalaya_cities.json',        name:'Meghalaya',        tagline:'Clouds, caves, and living root bridges',          emoji:'☁️', region:'North-East India', image:'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', type:'state' },
  { id:'mizoram',          file:'mizoram_cities.json',          name:'Mizoram',          tagline:'Rolling hills and peaceful landscapes',           emoji:'🌄', region:'North-East India', image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', type:'state' },
  { id:'nagaland',         file:'nagaland_cities.json',         name:'Nagaland',         tagline:'Festivals, hills, and warrior traditions',        emoji:'🎉', region:'North-East India', image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80', type:'state' },
  { id:'odisha',           file:'odisha_cities.json',           name:'Odisha',           tagline:'Temples, beaches, and classical heritage',        emoji:'🛕', region:'East India',       image:'https://images.unsplash.com/photo-1590766940554-634680e08fa0?w=800&q=80', type:'state' },
  { id:'punjab',           file:'punjab_cities.json',           name:'Punjab',           tagline:'Fields, forts, and vibrant Punjabi spirit',       emoji:'🌾', region:'North India',      image:'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=800&q=80', type:'state' },
  { id:'rajasthan',        file:'rajasthan_cities.json',        name:'Rajasthan',        tagline:'Land of kings, deserts, and vibrant culture',     emoji:'🏰', region:'North-West India', image:'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80', type:'state' },
  { id:'sikkim',           file:'sikkim_cities.json',           name:'Sikkim',           tagline:'Mountains, monasteries, and alpine beauty',       emoji:'🏔️', region:'North-East India', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', type:'state' },
  { id:'tamil-nadu',       file:'tamil_nadu_cities.json',       name:'Tamil Nadu',       tagline:'Temples, tradition, and coastal charm',           emoji:'🛕', region:'South India',      image:'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80', type:'state' },
  { id:'telangana',        file:'telangana_cities.json',        name:'Telangana',        tagline:'Heritage, innovation, and Deccan culture',        emoji:'🏛️', region:'South India',      image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80', type:'state' },
  { id:'tripura',          file:'tripura_cities.json',          name:'Tripura',          tagline:'Palaces, forests, and cultural richness',         emoji:'🌳', region:'North-East India', image:'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', type:'state' },
  { id:'uttar-pradesh',    file:'uttar_pradesh_cities.json',    name:'Uttar Pradesh',    tagline:'Sacred cities, history, and timeless culture',    emoji:'🕌', region:'North India',      image:'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=80', type:'state' },
  { id:'uttarakhand',      file:'uttarakhand_cities.json',      name:'Uttarakhand',      tagline:'Mountains, rivers, and spiritual retreats',       emoji:'⛰️', region:'North India',      image:'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?w=800&q=80', type:'state' },
  { id:'west-bengal',      file:'west_bengal_cities.json',      name:'West Bengal',      tagline:'Culture, cuisine, and colonial charm',            emoji:'🎭', region:'East India',       image:'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80', type:'state' },
];

const UNION_TERRITORIES = [
  { id:'andaman-and-nicobar-islands', file:'andaman_and_nicobar_islands_cities.json', name:'Andaman & Nicobar Islands', tagline:'Islands, coral reefs, and tropical paradise',  emoji:'🏝️', region:'Island Territories', image:'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80', type:'ut' },
  { id:'chandigarh',                  file:'chandigarh_cities.json',                  name:'Chandigarh',               tagline:'The City Beautiful — India\'s best-planned city', emoji:'🏙️', region:'North India',      image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', type:'ut' },
  { id:'dadra-and-nagar-haveli-and-daman-and-diu', file:'dadra_and_nagar_haveli_and_daman_and_diu_cities.json', name:'Dadra & NH and Daman & Diu', tagline:'Coastal charm with Portuguese heritage', emoji:'🌊', region:'West India', image:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', type:'ut' },
  { id:'delhi',                       file:'delhi_cities.json',                       name:'Delhi',                    tagline:'The heart of India — monuments, power, and culture', emoji:'🏛️', region:'North India',     image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80', type:'ut' },
  { id:'jammu-and-kashmir',           file:'jammu_and_kashmir_cities.json',           name:'Jammu & Kashmir',           tagline:'Valleys, lakes, and breathtaking landscapes', emoji:'🏞️', region:'North India',        image:'https://images.unsplash.com/photo-1597074866923-dc0589150bd8?w=800&q=80', type:'ut' },
  { id:'ladakh',                      file:'ladakh_cities.json',                      name:'Ladakh',                    tagline:'High-altitude deserts and Himalayan beauty',  emoji:'🏔️', region:'North India',        image:'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?w=800&q=80', type:'ut' },
  { id:'lakshadweep',                 file:'lakshadweep_cities.json',                 name:'Lakshadweep',               tagline:'Turquoise lagoons and island serenity',       emoji:'🐚', region:'Island Territories', image:'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80', type:'ut' },
  { id:'puducherry',                  file:'puducherry_cities.json',                  name:'Puducherry',                tagline:'French vibes, beaches, and coastal calm',     emoji:'🌅', region:'South India',        image:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', type:'ut' },
];

const STATE_REGISTRY = [...STATES, ...UNION_TERRITORIES];

// ─── CATEGORIES ───────────────────────────────────────────────
const CATEGORIES = [
  { id: 'adventure',  label: 'Adventure',  emoji: '⛷️',  description: 'Thrilling experiences across India',   keywords: ['adventure','trekking','trek','rafting','paragliding','camping','sport'] },
  { id: 'cultural',   label: 'Cultural',   emoji: '🏛️',  description: 'Heritage, history, and living traditions', keywords: ['heritage','cultural','history','architecture','museum','art','palace','fort'] },
  { id: 'nature',     label: 'Nature',     emoji: '🌿',  description: 'Pristine landscapes and wildlife',       keywords: ['nature','wildlife','forest','waterfall','lake','hill station','national park','sanctuary'] },
  { id: 'food',       label: 'Food',       emoji: '🍛',  description: 'Culinary journeys and local flavours',   keywords: ['food','cuisine','market','street food','shopping'] },
  { id: 'spiritual',  label: 'Spiritual',  emoji: '🙏',  description: 'Sacred sites and pilgrimages',           keywords: ['spiritual','pilgrimage','temple','monastery','church','mosque','shrine'] },
  { id: 'beaches',    label: 'Beaches',    emoji: '🏖️',  description: 'Coastal paradises and island getaways',  keywords: ['beach','coast','island','sea','ocean','coral'] },
];

const TRENDING_SEARCHES = [
  { text: 'Jaipur',       type: 'city',  state: 'Rajasthan' },
  { text: 'Manali',       type: 'city',  state: 'Himachal Pradesh' },
  { text: 'Goa Beaches',  type: 'place', state: 'Goa' },
  { text: 'Varanasi',     type: 'city',  state: 'Uttar Pradesh' },
  { text: 'Ladakh',       type: 'state', state: 'Ladakh' },
  { text: 'Munnar',       type: 'city',  state: 'Kerala' },
  { text: 'Rishikesh',    type: 'city',  state: 'Uttarakhand' },
  { text: 'Hampi',        type: 'city',  state: 'Karnataka' },
];

// ─── DATA CACHE ───────────────────────────────────────────────
const dataDir = path.join(__dirname, '..', 'public', 'data');
const stateDataCache = {};

function getStateData(stateId) {
  if (stateDataCache[stateId]) return stateDataCache[stateId];

  const meta = STATE_REGISTRY.find(s => s.id === stateId);
  if (!meta) return null;

  const filePath = path.join(dataDir, meta.file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    stateDataCache[stateId] = parsed;
    return parsed;
  } catch (err) {
    console.error(`Failed to load ${filePath}:`, err.message);
    return null;
  }
}

function getStateMeta(stateId) {
  return STATE_REGISTRY.find(s => s.id === stateId) || null;
}

// ─── SEARCH ───────────────────────────────────────────────────
function searchAllStates(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];

  for (const meta of STATE_REGISTRY) {
    // Match state name
    if (meta.name.toLowerCase().includes(q)) {
      results.push({ type: 'state', name: meta.name, stateId: meta.id, stateName: meta.name, emoji: meta.emoji, region: meta.region, image: meta.image });
    }

    // Match cities
    const data = getStateData(meta.id);
    if (!data || !data.cities) continue;

    for (const city of data.cities) {
      const matchesName    = city.name.toLowerCase().includes(q);
      const matchesTagline = (city.tagline || '').toLowerCase().includes(q);
      const matchesTags    = (city.tags || []).some(t => t.toLowerCase().includes(q));
      const matchesType    = (city.type || '').toLowerCase().includes(q);

      if (matchesName || matchesTagline || matchesTags || matchesType) {
        results.push({
          type: 'city',
          name: city.name,
          cityId: city.id,
          stateId: meta.id,
          stateName: meta.name,
          emoji: meta.emoji,
          tagline: city.tagline || '',
          cityType: city.type || '',
          image: city.hero_image || meta.image,
          region: city.region || meta.region,
          tags: city.tags || [],
          best_time: city.best_time || '',
          placesCount: (city.places || []).length,
        });
      }

      // Match places within city
      if (city.places) {
        for (const place of city.places) {
          const placeMatch = (place.name || '').toLowerCase().includes(q) ||
                             (place.category || '').toLowerCase().includes(q) ||
                             (place.description || '').toLowerCase().includes(q);
          if (placeMatch) {
            results.push({
              type: 'place',
              name: place.name,
              cityName: city.name,
              cityId: city.id,
              stateId: meta.id,
              stateName: meta.name,
              emoji: meta.emoji,
              category: place.category || '',
              image: place.image || city.hero_image || meta.image,
              rating: place.rating || 0,
            });
          }
        }
      }
    }
  }

  // Deduplicate and limit
  const seen = new Set();
  const unique = results.filter(r => {
    const key = `${r.type}-${r.name}-${r.stateId || ''}-${r.cityId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 50);
}

// ─── CATEGORY FILTER ──────────────────────────────────────────
function getCategoryResults(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return { category: null, results: [] };

  const results = [];

  for (const meta of STATE_REGISTRY) {
    const data = getStateData(meta.id);
    if (!data || !data.cities) continue;

    for (const city of data.cities) {
      const tagsMatch = (city.tags || []).some(t =>
        cat.keywords.some(kw => t.toLowerCase().includes(kw))
      );
      const typeMatch = cat.keywords.some(kw =>
        (city.type || '').toLowerCase().includes(kw)
      );
      const placesMatch = (city.places || []).some(p =>
        cat.keywords.some(kw =>
          (p.category || '').toLowerCase().includes(kw) ||
          (p.subcategory || '').toLowerCase().includes(kw)
        )
      );

      if (tagsMatch || typeMatch || placesMatch) {
        results.push({
          name: city.name,
          cityId: city.id,
          stateId: meta.id,
          stateName: meta.name,
          emoji: meta.emoji,
          tagline: city.tagline || '',
          cityType: city.type || '',
          image: city.hero_image || meta.image,
          region: city.region || meta.region,
          tags: city.tags || [],
          best_time: city.best_time || '',
          placesCount: (city.places || []).length,
        });
      }
    }
  }

  return { category: cat, results };
}

// ─── HIDDEN GEMS vs POPULAR ──────────────────────────────────
// A city is "popular" if it has many places (>= 4) or tags include popular keywords.
// Otherwise it's a "hidden gem".
const POPULAR_KEYWORDS = ['golden triangle', 'heritage', 'family', 'romantic', 'honeymoon', 'popular', 'famous', 'metro'];

function classifyCities(cities) {
  const popular = [];
  const hiddenGems = [];

  for (const city of cities) {
    const tags = (city.tags || []).map(t => t.toLowerCase());
    const placesCount = (city.places || []).length;
    const isPopular = placesCount >= 4 || tags.some(t => POPULAR_KEYWORDS.some(kw => t.includes(kw)));

    if (isPopular) {
      popular.push(city);
    } else {
      hiddenGems.push(city);
    }
  }

  return { popular, hiddenGems };
}

// ─── FEATURED DESTINATIONS (for Homepage) ─────────────────────
// Returns a curated list of iconic Indian cities for the home page
function getFeaturedDestinations() {
  const featured = [
    { stateId: 'rajasthan',       cityId: 'jaipur',     badge: '⭐ Featured',  badgeColor: '#00AA6C' },
    { stateId: 'goa',             cityId: 'panaji',     badge: '🔥 Trending',  badgeColor: '#ff6348' },
    { stateId: 'rajasthan',       cityId: 'udaipur',    badge: '💎 Popular',   badgeColor: '#667eea' },
    { stateId: 'kerala',          cityId: null,         badge: '🌴 Must Visit',badgeColor: '#2ed573' },
    { stateId: 'uttarakhand',     cityId: null,         badge: '🏔️ Adventure', badgeColor: '#4facfe' },
    { stateId: 'jammu-and-kashmir', cityId: null,       badge: '❄️ Scenic',    badgeColor: '#a18cd1' },
  ];

  const results = [];

  for (const item of featured) {
    const meta = STATE_REGISTRY.find(s => s.id === item.stateId);
    if (!meta) continue;

    const data = getStateData(item.stateId);
    if (!data || !data.cities) continue;

    let city = item.cityId
      ? data.cities.find(c => c.id === item.cityId)
      : data.cities[0];

    if (!city) city = data.cities[0];
    if (!city) continue;

    // Compute avg rating from places
    const places = city.places || [];
    const avgRating = places.length > 0
      ? (places.reduce((s, p) => s + (p.rating || 0), 0) / places.length).toFixed(1)
      : '4.5';

    results.push({
      name: city.name,
      state: meta.name,
      tagline: city.tagline || meta.tagline,
      image: city.hero_image || meta.image,
      badge: item.badge,
      badgeColor: item.badgeColor,
      rating: avgRating,
      placesCount: places.length,
      stateId: meta.id,
      cityId: city.id,
      emoji: meta.emoji,
    });
  }

  return results;
}

module.exports = {
  STATES,
  UNION_TERRITORIES,
  STATE_REGISTRY,
  CATEGORIES,
  TRENDING_SEARCHES,
  getStateData,
  getStateMeta,
  searchAllStates,
  getCategoryResults,
  classifyCities,
  getFeaturedDestinations,
};
