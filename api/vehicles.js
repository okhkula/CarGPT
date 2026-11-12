// Car brand and model lookup, backed by the public NHTSA vPIC database.
// Any brand or model in that database works without code changes here.

const VPIC = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const KEEP_UPPER = new Set(['BMW', 'GMC', 'MG', 'BYD', 'AM', 'DS', 'TVR', 'AC', 'GAC', 'MV', 'VPG', 'SRT', 'FAW', 'JAC', 'BAIC', 'SAIC']);

function titleCase(name) {
  return String(name)
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^\s+$|^-$/.test(part) || !part) return part;
      if (KEEP_UPPER.has(part.toUpperCase())) return part.toUpperCase();
      if (/\d/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

function send(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store');
  res.end(JSON.stringify(body));
}

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('vpic ' + r.status);
  return r.json();
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const make = (url.searchParams.get('make') || '').trim().slice(0, 60);
  const year = (url.searchParams.get('year') || '').trim();
  try {
    if (!make) {
      const types = ['car', 'multipurpose passenger vehicle (mpv)', 'truck'];
      const results = await Promise.all(
        types.map((t) => getJson(`${VPIC}/GetMakesForVehicleType/${encodeURIComponent(t)}?format=json`).catch(() => ({ Results: [] })))
      );
      const names = new Set();
      results.forEach((r) => (r.Results || []).forEach((m) => m.MakeName && names.add(titleCase(m.MakeName))));
      if (!names.size) throw new Error('no makes');
      return send(res, 200, { makes: [...names].sort((a, b) => a.localeCompare(b)) }, true);
    }
    const path = /^\d{4}$/.test(year)
      ? `GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}`
      : `GetModelsForMake/${encodeURIComponent(make)}`;
    const data = await getJson(`${VPIC}/${path}?format=json`);
    const models = [...new Set((data.Results || []).map((m) => String(m.Model_Name || '').trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    return send(res, 200, { make, year: year || null, models }, true);
  } catch (err) {
    return send(res, 502, { error: 'The car database is not reachable right now.' }, false);
  }
};
