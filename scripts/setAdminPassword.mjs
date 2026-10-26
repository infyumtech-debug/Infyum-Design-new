import fs from 'fs';

const configPath = 'C:\\Users\\jay ahir\\.config\\configstore\\firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens?.access_token;

if (!token) {
  console.error('No Firebase access token found in firebase-tools.json');
  process.exit(1);
}

const projectId = 'creative-studio-f19a6';
const uid = '9nUewEcZAtN3lPBaQXBoyZ0DtRn2';
const newPassword = process.argv[2];

if (!newPassword) {
  console.log('Usage: node scripts/setAdminPassword.mjs <new-password>');
  process.exit(1);
}

async function setPassword() {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      localId: uid,
      password: newPassword
    })
  });

  const data = await res.json();
  if (data.localId) {
    console.log('✅ Admin password successfully updated in Firebase Authentication for infyumtech@gmail.com');
  } else {
    console.error('Failed to set password:', data);
  }
}

setPassword();
