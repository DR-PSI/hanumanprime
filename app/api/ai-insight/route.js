export async function POST(request) {
  try {
    const { data } = await request.json();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are an AI battery health analyst for power substations. Respond in Thai language. Be concise and technical. 2-3 sentences max.",
        messages: [{
          role: "user",
          content: `วิเคราะห์แบตเตอรี่สถานี BKK-01:
voltage=${data.string_voltage}V
temp=${data.temperature}°C
highest_cell=${data.highest_cell_voltage}V
lowest_cell=${data.lowest_cell_voltage}V
avg_diff=${data.avg_diff_mv}mV
extreme_diff=${data.extreme_diff_mv}mV
ให้ข้อวิเคราะห์และคำแนะนำ`
        }]
      })
    });

    const json = await res.json();
    return Response.json({
      insight: json.content?.[0]?.text || "ไม่สามารถวิเคราะห์ได้"
    });

  } catch (err) {
    return Response.json({ insight: "Error: " + err.message }, { status: 500 });
  }
}
