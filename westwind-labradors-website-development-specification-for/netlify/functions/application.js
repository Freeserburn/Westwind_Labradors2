// Server-side application delivery. Configure Resend and sender settings in host environment variables.
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const labels = {
  fullName: 'Name', email: 'Email', phone: 'Phone', city: 'City', state: 'State', zip: 'ZIP',
  hasPets: 'Currently owns pets', pets: 'Current pets', fencedYard: 'Fenced yard',
  activities: 'Exercise opportunities', preferredSex: 'Preferred sex', preferredColor: 'Preferred color',
  purpose: 'Primary interest', vetName: 'Veterinarian name', vetContact: 'Veterinarian contact',
  lookingFor: 'Looking for in a Labrador', additional: 'Additional information'
};

const groups = [
  ['Applicant Information', ['fullName', 'email', 'phone', 'city', 'state', 'zip']],
  ['Current Pets', ['hasPets', 'pets']],
  ['Home & Lifestyle', ['fencedYard', 'activities']],
  ['Puppy Preferences & Veterinary Care', ['preferredSex', 'preferredColor', 'purpose', 'vetName', 'vetContact']],
  ['More About You', ['lookingFor', 'additional']]
];

export default async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response('Invalid request', { status: 400 });
    if (body.website) return new Response(null, { status: 204 });

    for (const key of ['fullName', 'email', 'phone', 'city', 'state', 'zip', 'lookingFor']) {
      if (!String(body[key] || '').trim()) return new Response('Missing required field', { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(body.email) || JSON.stringify(body).length > 30000) {
      return new Response('Invalid request', { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.APPLICATION_RECIPIENT || !process.env.APPLICATION_FROM) {
      return new Response('Application delivery is not configured', { status: 503 });
    }

    const content = groups.map(([title, keys]) =>
      `<h2>${title}</h2>${keys.map(key => `<p><strong>${labels[key]}:</strong><br>${escape(body[key] || 'Not provided')}</p>`).join('')}`
    ).join('') + `<hr><p><strong>Application submitted:</strong> ${new Date().toISOString()}</p>`;

    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.APPLICATION_FROM,
        to: [process.env.APPLICATION_RECIPIENT],
        reply_to: body.email,
        subject: `New Puppy Application — ${body.fullName} — ${new Date().toLocaleDateString('en-US')}`,
        html: `<h1>WESTWIND LABRADORS<br>NEW PUPPY APPLICATION</h1>${content}`
      })
    });

    if (!result.ok) return new Response('Unable to deliver application', { status: 502 });
    return Response.json({ ok: true });
  } catch {
    return new Response('Unable to submit application', { status: 500 });
  }
};
