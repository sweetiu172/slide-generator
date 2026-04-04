const PIPER_URL = process.env.PIPER_URL || "http://localhost:5000";

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(`${PIPER_URL}/api/voices`);

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch voices" },
        { status: response.status },
      );
    }

    const voices = await response.json();
    return Response.json(voices);
  } catch {
    return Response.json(
      { error: "TTS service unavailable" },
      { status: 503 },
    );
  }
}
