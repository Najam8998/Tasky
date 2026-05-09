const url = "https://ntfy.sh/test_tasky_chat_123";

async function test() {
  await fetch(url, {
    method: "POST",
    body: JSON.stringify({ text: "Hello world", sender: "Alice" })
  });
  console.log("Sent");
}
test();
