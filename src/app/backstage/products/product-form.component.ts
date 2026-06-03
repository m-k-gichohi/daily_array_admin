import {
  Component, OnInit, signal, inject,
  ChangeDetectionStrategy, afterNextRender, ElementRef, viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { Category, Product} from '../../models';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';



@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink,AngularEditorModule],
  templateUrl: "./product-form.component.html",
  styleUrls: ["./product-form.component.css"],
})
export class ProductFormComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly cloudinary = inject(CloudinaryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);


  readonly isEditing = signal(false);
  readonly productId = signal<string | null>(null);
  readonly productName = signal('');
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly pageLoading = signal(true);
  readonly saving = signal(false);
  readonly uploadingImage = signal(false);
  readonly isDragging = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  private storageKey = 'tda-product-form-draft-new';

  readonly config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '25rem',
    minHeight: '15rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['bold']
      ],
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ]
  };


  form: Partial<Product> = {
    name: '', slug: '', tagline: '', category_id: '',
    description: '',
     amazon_url: '',
     image_url: '',
     is_featured: false, is_active: true, display_order: 0
  };


  constructor() {
    afterNextRender(() => {
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.storageKey = this.getDraftKey(id);

    const cats = await this.admin.getAllCategories();
    this.categories.set(cats);

    if (id) {
      this.isEditing.set(true);
      this.productId.set(id);
      const product = await this.admin.getProductById(id);
      if (product) {
        this.form = { ...product };
        this.productName.set(product.name);
      }
    }

    this.loadDraft();
    this.pageLoading.set(false);

  
  }



  autoSlug(): void {
    if (!this.isEditing()) {
      this.form.slug = (this.form.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  async copyImageUrl(text:string):Promise<void>{
      await navigator.clipboard.writeText(text);

  }






  // ── IMAGE UPLOAD ──
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) await this.uploadImage(file);
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.uploadImage(file);
  }

  private async uploadImage(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Please select an image file.');
      return;
    }
    this.uploadError.set(null);
    this.uploadingImage.set(true);
    try {
      const url = await this.cloudinary.uploadImage(file);
      this.form = { ...this.form, image_url: url };
      this.saveDraft();
    } catch (e) {
      this.uploadError.set('Upload failed. Check your Cloudinary credentials.');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  // ── SAVE ──
  async save(): Promise<void> {
    console.log("values", this.form);
    if (!this.form.name || !this.form.slug || !this.form.category_id || !this.form.amazon_url) {
      this.saveError.set('Please fill in all required fields (name, slug, category, Amazon URL).');
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

 



    try {
      if (this.isEditing() && this.productId()) {
        await this.admin.updateProduct(this.productId()!, this.form);
      } else {
        await this.admin.createProduct(this.form);
      }
      localStorage.removeItem(this.storageKey);
      await this.router.navigate(['/backstage/products']);
    } catch (e: any) {
      this.saveError.set(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  onDescriptionChange(value: string): void {
    this.form.description = value;
    this.saveDraft();
  }

  private getDraftKey(id: string | null): string {
    return id ? `tda-product-form-draft-${id}` : 'tda-product-form-draft-new';
  }

  private loadDraft(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as { image_url?: string; description?: string };
      if (draft.image_url) {
        this.form.image_url = draft.image_url;
      }
      if (draft.description) {
        this.form.description = draft.description;
      }
    } catch {
      // Ignore invalid draft data.
    }
  }

  private saveDraft(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        image_url: this.form.image_url,
        description: this.form.description,
      }));
    } catch {
      // Ignore localStorage errors.
    }
  }
}
