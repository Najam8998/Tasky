const url = "https://ntfy.sh/test_tasky_chat_123/json?since=1h";

async function test() {
  const res = await fetch(url);
  const text = await res.text();
  console.log("Response length:", text.length);
  const events = text.split('\n').filter(Boolean).map(JSON.parse);
  console.log("Events:", events);
}
test();
