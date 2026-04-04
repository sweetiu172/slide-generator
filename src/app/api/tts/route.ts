const PIPER_URL = process.env.PIPER_URL || "http://localhost:5000";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();

  const response = await fetch(`${PIPER_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "TTS generation failed" }));
    return Response.json(error, { status: response.status });
  }

  const contentType = response.headers.get("Content-Type") || "audio/wav";
  const isMP3 = contentType.includes("mpeg");

  return new Response(response.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="speech.${isMP3 ? "mp3" : "wav"}"`,
    },
  });
}
