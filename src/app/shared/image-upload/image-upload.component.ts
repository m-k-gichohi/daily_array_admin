import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../services/cloudinary.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent {
  readonly imageUrl = input<string | null | undefined>(undefined);
  readonly uploadFolder = input<'pins' | 'products'>('products');
  readonly label = input<string>('Product image');
  readonly uploadErrorMessage = input<string | null>(null);

  readonly imageUrlChange = output<string | null>();
  readonly uploadError = output<string | null>();

  private readonly cloudinary = inject(CloudinaryService);

  readonly isDragging = signal(false);
  readonly uploadingImage = signal(false);
  readonly error = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      await this.uploadImage(file);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      await this.uploadImage(file);
    }
  }

  async copyImageUrl(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  private async uploadImage(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.error.set('Please select an image file.');
      this.uploadError.emit(this.error());
      return;
    }

    this.error.set(null);
    this.uploadingImage.set(true);

    try {
      const url = await this.cloudinary.uploadImage(file, this.uploadFolder());
      this.imageUrlChange.emit(url);
      this.uploadError.emit(null);
    } catch {
      this.error.set('Upload failed. Check your Cloudinary credentials.');
      this.uploadError.emit(this.error());
    } finally {
      this.uploadingImage.set(false);
    }
  }
}
