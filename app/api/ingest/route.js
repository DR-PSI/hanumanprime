// v2
export async function POST(request) {
  try {
    const data = await request.json();
    console.log('BMS Data received:', data);
    return Response.json({ 
      success: true, 
      message: 'Data received',
      timestamp: new Date().toISOString(),
      data: data
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
