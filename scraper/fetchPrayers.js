const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// JIAR via Masjidal API
async function fetchJIAR() {
  const parkwood = await axios.get(
    "https://masjidal.com/api/v1/time?masjid_id=M9L2eyKZ"
  );
  const fayetteville = await axios.get(
    "https://masjidal.com/api/v1/time?masjid_id=y0Lb7DAo"
  );

  return {
    parkwood: parkwood.data.data,
    fayetteville: fayetteville.data.data,
  };
}

// Generic HTML scraper for other masjids
async function scrapeGenericMasjid(url, orgName) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let prayers = {};

    // This selector may need adjustment per masjid
    $("table tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 2) {
        const name = $(cols[0]).text().trim().toLowerCase();
        const iqamah = $(cols[2]).text().trim();

        if (name.includes("fajr")) prayers.fajr = iqamah;
        if (name.includes("dhuhr") || name.includes("zuhr"))
          prayers.dhuhr = iqamah;
        if (name.includes("asr")) prayers.asr = iqamah;
        if (name.includes("maghrib")) prayers.maghrib = iqamah;
        if (name.includes("isha")) prayers.isha = iqamah;
      }
    });

    return prayers;
  } catch (err) {
    console.log(`Error scraping ${orgName}:`, err.message);
    return {};
  }
}

async function main() {
  const result = {
    lastUpdated: new Date().toISOString(),
    daily: {},
    jumah: {},
    taraweeh: {},
    eid: {
      eid_al_fitr: {},
      eid_al_adha: {},
    },
  };

  // JIAR Masjidal API
  result.daily.jiar = await fetchJIAR();

  // Other Masjids via HTML scraping
  result.daily.iar = await scrapeGenericMasjid(
    "https://raleighmasjid.org/",
    "IAR"
  );

  result.daily.icm = await scrapeGenericMasjid(
    "https://www.icmnc.org/",
    "ICM"
  );

  result.daily.icc = await scrapeGenericMasjid(
    "https://www.carymasjid.org/",
    "ICC"
  );

  result.daily.apex = await scrapeGenericMasjid(
    "https://apexmosque.org/",
    "APEX"
  );

  result.daily.mycc = await scrapeGenericMasjid(
    "https://mycc-rdu.org/",
    "MYCC"
  );

  fs.writeFileSync(
    "./data/triangle-prayer-times.json",
    JSON.stringify(result, null, 2)
  );

  console.log("✅ Prayer times updated.");
}

main();
