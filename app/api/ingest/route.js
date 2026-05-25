const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

export async function POST(request) {
  try {
    const data = await request.json();

    const row = {
      device_id:            data.device_id || null,
      device_name:          data.device_name || null,
      station_id:           data.station_id || null,
      ip:                   data.ip || null,
      string_voltage:       parseNum(data.string_voltage),
      current:              parseNum(data.current),
      temperature:          parseNum(data.temperature),
      highest_cell_voltage: parseNum(data.highest_cell_voltage),
      lowest_cell_voltage:  parseNum(data.lowest_cell_voltage),
      avg_diff_mv:          parseNum(data.avg_diff_mv),
      extreme_diff_mv:      parseNum(data.extreme_diff_mv),
      soh:                  parseNum(data.soh),
      soc:                  parseNum(data.soc),
      latest_voltage_dt:    data.latest_voltage_dt || null,
      raw_data:             data,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/bms_data`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ success: false, error: err }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Data saved',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bms_data?select=*&order=created_at.desc&limit=100`,
      { headers }
    );

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ success: false, error: err }, { status: 500 });
    }

    const rows = await res.json();

    const latest = {};
    for (const row of rows) {
      if (!latest[row.station_id]) latest[row.station_id] = row;
    }

    const histRes = await fetch(
      `${SUPABASE_URL}/rest/v1/bms_data?select=string_voltage,temperature,created_at&station_id=eq.BKK-01&order=created_at.desc&limit=50`,
      { headers }
    );
    const history = histRes.ok ? await histRes.json() : [];

    return Response.json({
      success: true,
      latest: Object.values(latest),
      history: history.reverse(),
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
