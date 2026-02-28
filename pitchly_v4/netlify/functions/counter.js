const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

if (!global.__pitchlyCount) global.__pitchlyCount = 1247;

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod === "POST") global.__pitchlyCount++;
  return { statusCode: 200, headers: cors, body: JSON.stringify({ count: global.__pitchlyCount }) };
};
