

async function register() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: "amaan butt",
      email: "amaanb@gmail.com",
      password: "0300123456"
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Data:', data);
}
register();
