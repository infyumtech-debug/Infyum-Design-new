import fs from 'fs';

const configPath = 'C:\\Users\\jay ahir\\.config\\configstore\\firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens?.access_token;

if (!token) {
  console.error('No Firebase access token found');
  process.exit(1);
}

const projectId = 'creative-studio-f19a6';
const uid = '9nUewEcZAtN3lPBaQXBoyZ0DtRn2';
const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_users/${uid}`;

async function setup() {
  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: uid },
        email: { stringValue: 'infyumtech@gmail.com' },
        role: { stringValue: 'admin' },
        createdAt: { timestampValue: new Date().toISOString() },
        status: { stringValue: 'active' }
      }
    })
  });

  const data = await res.json();
  if (data.name) {
    console.log('✅ Admin user securely configured in Firestore:', data.name);
  } else {
    console.error('Firestore response error:', data);
  }
}

setup();
