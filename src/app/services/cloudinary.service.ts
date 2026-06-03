import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName = environment.cloudinaryCloudName;
  private readonly uploadPreset = environment.cloudinaryUploadPreset;
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Return secure HTTPS URL
    return data.secure_url as string;
  }

  async uploadFromDataUrl(dataUrl: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', this.uploadPreset);

    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url as string;
  }
}
