// v3 Full BMS Data
export async function POST(request) {
  try {
    const data = await request.json();

    const parseNum = (val) => {
      if (!val) return null;
      const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
      return isNaN(n) ? null : n;
    };

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/bms_data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          device_id: data.device_id || null,
          device_name: data.device_name || null,
          ip: data.ip || null,
          station_id: data.station_id || null,
          soh: parseNum(data.soh),
          soc: parseNum(data.soc),
          string_voltage: parseNum(data.string_voltage),
          current: parseNum(data.current),
          temperature: parseNum(data.temperature),
          voltage: data.string_voltage || null,
          raw_data: data
        })
      }
    );

    if (!response.ok) {
      const error = awa
