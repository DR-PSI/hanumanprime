
"use client"; // v2

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('BMS Data received:', data);

    // Save to Supabase
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
          voltage: data.string_voltage || null,
          raw_data: data
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    return Response.json({
      success: true,
      message: 'Data saved to database',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'BMS API endpoint ready'
  });
}
