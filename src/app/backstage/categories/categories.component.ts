import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Category } from '../../models';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule,AngularEditorModule],
  templateUrl: "./categories.component.html",
  styleUrls: ["./categories.component.css"],
})
export class CategoriesComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showModal = signal(false);
  readonly editingCat = signal<Category | null>(null);
  readonly deleteTarget = signal<Category | null>(null);
  readonly formSaving = signal(false);
  readonly formError = signal<string | null>(null);



    readonly config: AngularEditorConfig = {
      editable: true,
      spellcheck: true,
      height: '25rem',
      minHeight: '15rem',
      placeholder: 'Enter text here...',
      translate: 'no',
      showToolbar:false,
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

  form: Partial<Category> = {
    name: '', slug: '', subdomain: '', description: '', meta_description: '',
    hero_tagline: '', hero_html: '', display_order: 0, is_active: true
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.categories.set(await this.admin.getAllCategories());
    } finally {
      this.loading.set(false);
    }
  }

  openModal(cat?: Category): void {
    if (cat) {
      this.editingCat.set(cat);
      this.form = { ...cat };
    } else {
      this.editingCat.set(null);
      this.form = { name: '', slug: '', subdomain: '', description: '', meta_description: '', hero_tagline: '', hero_html: '', display_order: 0, is_active: true };
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  autoSlug(): void {
    if (!this.editingCat()) {
      this.form.slug = (this.form.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  async save(): Promise<void> {
    if (!this.form.name?.trim() || !this.form.slug?.trim() || !this.form.subdomain?.trim() || !this.form.description?.trim() || !this.form.meta_description?.trim() || !this.form.hero_tagline?.trim() || !this.form.hero_html?.trim()) {
      this.formError.set('All fields are required.');
      return;
    }
    this.formSaving.set(true);
    this.formError.set(null);
    try {
      if (this.editingCat()) {
        await this.admin.updateCategory(this.editingCat()!.id, this.form);
      } else {
        await this.admin.createCategory(this.form);
      }
      await this.load();
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? 'Something went wrong.');
    } finally {
      this.formSaving.set(false);
    }
  }
    onDescriptionChange(value: string): void {
    this.form.description = value;
  }

  confirmDelete(cat: Category): void {
    this.deleteTarget.set(cat);
  }

  async deleteCategory(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.admin.deleteCategory(target.id);
    this.categories.update(list => list.filter(c => c.id !== target.id));
    this.deleteTarget.set(null);
  }
}
