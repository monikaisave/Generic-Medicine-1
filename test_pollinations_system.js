async function test() {
  try {
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are GenMed AI, a helpful and intelligent medical and general AI assistant. You must answer ANY question the user asks, on ANY topic whatsoever. If the user asks about health, specialize in generic medicines."
          },
          {
            role: "user",
            content: "Explain how photosythesis works in one sentence."
          }
        ],
        model: "openai"
      })
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
