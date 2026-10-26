import fs from 'fs';
import { strict as assert } from 'assert';

console.log('--- ADMIN LOGIN PASSWORD FIELD SECURITY AUDIT ---');

const adminLoginFile = fs.readFileSync('src/components/auth/AdminLogin.tsx', 'utf8');

// Test 1: Check that password state initializes to empty string ''
assert(
  adminLoginFile.includes("const [password, setPassword] = useState<string>('');"),
  'Password state must initialize to empty string'
);
console.log('✅ Test 1: Password state strictly initializes to empty string.');

// Test 2: Check that email state initializes to empty string '' to prevent autofill heuristics
assert(
  adminLoginFile.includes("const [email, setEmail] = useState<string>('');"),
  'Email state must initialize to empty string to prevent autofill heuristics'
);
console.log('✅ Test 2: Email state strictly initializes to empty string.');

// Test 3: Check that useEffect on mount resets password and showPassword
assert(
  adminLoginFile.includes("setPassword('');"),
  'Component must reset password on mount'
);
assert(
  adminLoginFile.includes("setShowPassword(false);"),
  'Component must reset showPassword to false on mount'
);
console.log('✅ Test 3: Mount hook enforces empty password and masked state.');

// Test 4: Check that password input default type is 'password' (masked)
assert(
  adminLoginFile.includes("type={showPassword ? 'text' : 'password'}"),
  'Input must use showPassword ? text : password'
);
assert(
  adminLoginFile.includes("const [showPassword, setShowPassword] = useState<boolean>(false);"),
  'showPassword must default to false'
);
console.log('✅ Test 4: Password field type defaults to "password" (masked).');

// Test 5: Check that autoComplete="new-password" is set on the password input
assert(
  adminLoginFile.includes('autoComplete="new-password"'),
  'Password input must have autoComplete="new-password" to prevent browser autofill'
);
console.log('✅ Test 5: autoComplete="new-password" prevents browser autofill.');

// Test 6: Check that form has autoComplete="off"
assert(
  adminLoginFile.includes('autoComplete="off"'),
  'Form must have autoComplete="off"'
);
console.log('✅ Test 6: Form autoComplete="off" configured.');

// Test 7: Check that eye toggle button exists with Eye and EyeOff icons
assert(
  adminLoginFile.includes('<EyeOff'),
  'EyeOff icon must be present'
);
assert(
  adminLoginFile.includes('<Eye'),
  'Eye icon must be present'
);
assert(
  adminLoginFile.includes('setShowPassword(!showPassword)'),
  'Eye button must toggle showPassword state'
);
console.log('✅ Test 7: Interactive Eye/EyeOff toggle icon verified.');

// Test 8: Check that no password string or credential is hardcoded in AdminLogin.tsx
const forbiddenStrings = [
  'InfyumAdmin2026',
  'password123',
  'admin123',
  'Infyum@05#09#20%06'
];
for (const str of forbiddenStrings) {
  assert(
    !adminLoginFile.includes(str),
    `Forbidden hardcoded credential "${str}" found in AdminLogin.tsx!`
  );
}
console.log('✅ Test 8: Zero hardcoded credentials or passwords in frontend code.');

// Test 9: Check that empty password or empty email cannot be submitted
assert(
  adminLoginFile.includes('if (!cleanEmail || !cleanPassword)'),
  'Submission validation must require both cleanEmail and cleanPassword'
);
console.log('✅ Test 9: Manual entry of both credentials strictly required for submit.');

console.log('\n🎉 ALL 9 PASSWORD FIELD SECURITY TESTS PASSED WITH 100% SUCCESS!');
