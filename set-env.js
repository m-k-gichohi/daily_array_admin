const fs = require('fs');
const path = require('path');

function readExistingValue(filePath, key) {
  if (!fs.existsSync(filePath)) return '';

  const contents = fs.readFileSync(filePath, 'utf8');
  const match = contents.match(new RegExp(`${key}:\\s*'([^']*)'`));
  return match ? match[1] : '';
}

const devEnvPath = path.join(__dirname, 'src/environments/environment.development.ts');
const prodEnvPath = path.join(__dirname, 'src/environments/environment.ts');

const supabaseUrl = process.env.SUPABASE_URL || readExistingValue(devEnvPath, 'supabaseUrl') || readExistingValue(prodEnvPath, 'supabaseUrl') || '';
const supabaseKey = process.env.SUPABASE_KEY || readExistingValue(devEnvPath, 'supabaseKey') || readExistingValue(prodEnvPath, 'supabaseKey') || '';
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || readExistingValue(devEnvPath, 'cloudinaryCloudName') || readExistingValue(prodEnvPath, 'cloudinaryCloudName') || '';
const cloudinaryUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || readExistingValue(devEnvPath, 'cloudinaryUploadPreset') || readExistingValue(prodEnvPath, 'cloudinaryUploadPreset') || '';
const pinterestClientId = process.env.PINTEREST_CLIENT_ID || readExistingValue(devEnvPath, 'pinterestClientId') || readExistingValue(prodEnvPath, 'pinterestClientId') || '';
const pinterestClientSecret = process.env.PINTEREST_CLIENT_SECRET || readExistingValue(devEnvPath, 'pinterestClientSecret') || readExistingValue(prodEnvPath, 'pinterestClientSecret') || '';
const pinterestRedirectUri = process.env.PINTEREST_REDIRECT_URI || readExistingValue(devEnvPath, 'pinterestRedirectUri') || readExistingValue(prodEnvPath, 'pinterestRedirectUri') || '';

const envConfigFile = `export const environment = {
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
  cloudinaryCloudName: '${cloudinaryCloudName}',
  cloudinaryUploadPreset: '${cloudinaryUploadPreset}',
  pinterestClientId: '${pinterestClientId}',
  pinterestClientSecret: '${pinterestClientSecret}',
  pinterestRedirectUri: '${pinterestRedirectUri}',

};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'environment.ts'), envConfigFile);
fs.writeFileSync(path.join(dir, 'environment.development.ts'), envConfigFile);

console.log('Environment variables injected successfully!');
