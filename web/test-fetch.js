const fetch = require('node-fetch');

const publishableApiKey = "pk_9d9c7cc93a1c4e35d471cc73b39ed7f0bf4fdec423c9c6c0100b2473b7de858e";
const regionId = "reg_01KNXQFEE8M528XWAACHK0PFAE";

async function testFetch() {
  try {
    const res = await fetch(`http://localhost:9000/store/payment-providers?region_id=${regionId}`, {
      headers: {
        "x-publishable-api-key": publishableApiKey,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testFetch();
