const form = document.querySelector('#puppy-application');
const status = form.querySelector('.form-status');

form.addEventListener('submit', async event => {
  event.preventDefault();
  const invalid = [...form.querySelectorAll('[required]')].filter(field => !field.value.trim());
  if (invalid.length) {
    status.textContent = 'Please complete all required fields.';
    status.className = 'form-status error';
    invalid[0].focus();
    return;
  }

  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Submitting…';

  try {
    const response = await fetch('/.netlify/functions/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    if (response.ok) {
      status.textContent = 'Thank you — your application has been submitted.';
      status.className = 'form-status success';
      form.reset();
    } else if (response.status === 400) {
      status.textContent = 'Please review the required fields and try again.';
      status.className = 'form-status error';
    } else if (response.status === 503) {
      status.textContent = 'Application delivery is being configured. Please email contact@westwindlabradors.com for assistance.';
      status.className = 'form-status error';
    } else {
      status.textContent = 'We could not submit your application right now. Please email contact@westwindlabradors.com for assistance.';
      status.className = 'form-status error';
    }
  } catch {
    status.textContent = 'We could not submit your application right now. Please email contact@westwindlabradors.com for assistance.';
    status.className = 'form-status error';
  } finally {
    button.disabled = false;
    button.textContent = 'Submit Puppy Application';
  }
});
