const axios = require('axios');

async function test() {
  const requests = Array.from({ length: 10 }, (_, i) =>
    axios.post('http://localhost:8000/api/users/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }).then(res => ({ i, status: res.status }))
      .catch(err => ({ i, status: err.response?.status }))
  );

  const results = await Promise.all(requests);
  results.forEach(r => console.log(`Request ${r.i}: ${r.status}`));

  const allowedCount = results.filter(r => r.status !== 429).length;
  console.log(`\nTotal allowed through: ${allowedCount} (expected: 5)`);
}

test();