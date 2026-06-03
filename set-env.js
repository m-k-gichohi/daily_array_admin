const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const cloudinaryUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';


const envConfigFile = `export const environment = {
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
  cloudinaryCloudName: '${cloudinaryCloudName}',
  cloudinaryUploadPreset: '${cloudinaryUploadPreset}',

};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'environment.ts'), envConfigFile);
fs.writeFileSync(path.join(dir, 'environment.development.ts'), envConfigFile);

console.log('Environment variables injected successfully!');
