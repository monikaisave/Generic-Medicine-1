async function testChat(message) {
  console.log(`Sending message: "${message}"`);
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", data.response);
    console.log("-".repeat(50));
  } catch (e) {
    console.error("Error calling chat endpoint:", e);
  }
}

async function run() {
  // Test general knowledge query
  await testChat("What is the capital of France?");
  // Test generic medicine query
  await testChat("What is a generic medicine?");
  // Test another general query to ensure no matches to local fallback
  await testChat("Who wrote Hamlet?");
}

run();
