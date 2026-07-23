import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Product, Category } from "src/app/models";
import { AdminService } from "src/app/services/admin.service";
import { PinterestPin } from "./model/pins";
import { FormsModule } from "@angular/forms";
import { PinterestBoard } from "./model/pin-boards";
import { ActivatedRoute } from "@angular/router";
import { ImageUploadComponent } from "src/app/shared/image-upload/image-upload.component";
import { PinterestConnectionStatusComponent } from "src/app/shared/pinterest-connection-status/pinterest-connection-status.component";
import { DateTime } from "luxon";

@Component({
  selector: "app-pins",
  imports: [
    FormsModule,
    ImageUploadComponent,
    PinterestConnectionStatusComponent,
  ],
  templateUrl: "./pins.component.html",
  styleUrl: "./pins.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinsComponent implements OnInit {
  private storageKey = "tda-pin-form-draft-new";

  private readonly admin = inject(AdminService);

  readonly pins = signal<PinterestPin[]>([]);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<"all" | "draft" | "scheduled" | "posted" | "failed">(
    "all",
  );
  readonly showModal = signal(false);
  readonly editingPin = signal<PinterestPin | null>(null);
  readonly deleteTarget = signal<PinterestPin | null>(null);
  readonly formSaving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly boards = signal<PinterestBoard[]>([]);

  route = inject(ActivatedRoute);

  scheduleDate = "";
  scheduleTime = "";
  targetTimezone = 'Africa/Nairobi';
  // "America/New_York";

  form: Partial<PinterestPin> = {
    product_id: null,
    category_id: null,
    board_name: "",
    board_id: "",
    pin_title: "",
    pin_description: "",
    destination_url: "",
    status: "draft",
    image_url: "",
    is_amazon_redirect: true,
    is_ai_generated: false,
    alt_text: "",
    cloudinary_public_id: "",
  };

  readonly filteredPins = computed(() => {
    const f = this.filter();
    if (f === "all") return this.pins();
    return this.pins().filter((p) => p.status === f);
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    const id = this.route.snapshot.paramMap.get("id");
    this.storageKey = this.getDraftKey(id);

    this.route.data.subscribe((data) => {
      this.boards.set(data["boards"]);
    });

    this.loadDraft();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [pins, products, categories] = await Promise.all([
        this.admin.getAllPins(),
        this.admin.getAllProducts(),
        this.admin.getAllCategories(),
      ]);
      this.pins.set(pins as PinterestPin[]);
      this.products.set(products);

      this.categories.set(categories);
    } finally {
      this.loading.set(false);
    }
  }

  countByStatus(status: string): number {
    return this.pins().filter((p) => p.status === status).length;
  }

  statusIcon(status: string): string {
    switch (status) {
      case "draft":
        return "bi-file-earmark";
      case "scheduled":
        return "bi-clock-history";
      case "posted":
        return "bi-check-circle-fill";
      case "failed":
        return "bi-exclamation-triangle-fill";
      default:
        return "bi-circle";
    }
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) +
      " EST"
    );
  }

  openModal(pin?: PinterestPin): void {
    if (pin) {
      console.log("piin ", pin);
      console.log("piin ", this.form);

      this.editingPin.set(pin);
      this.form = { ...pin };

      if (pin.publish_at) {
        const dt = DateTime.fromISO(pin.publish_at, { zone: "utc" }).setZone(
          this.targetTimezone,
        );

        this.scheduleDate = dt.toFormat("yyyy-MM-dd");
        this.scheduleTime = dt.toFormat("HH:mm");
      }
    } else {
      this.editingPin.set(null);
      this.form = {
        product_id: null,
        category_id: null,
        board_name: "",
        board_id: "",
        pin_title: "",
        pin_description: "",
        destination_url: "",
        status: "draft",
        alt_text: "",
        is_amazon_redirect: true,
        is_ai_generated: false,
      };
      this.scheduleDate = "";
      this.scheduleTime = "";
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onProductSelected(): void {
    if (!this.form.is_amazon_redirect) {
      const product = this.products().find(
        (p) => p.id === this.form.product_id,
      );
      if (product) {
        this.form.destination_url = `https://dailyarrayshop.com/products/${product.slug}`;
        this.form.category_id = product.category_id;
      }
    }
  }

  onBoardSelected(value: string): void {
    const selectedBoard = this.boards().find((board) => board.name === value);

    this.form = {
      ...this.form,
      board_name: value,
      board_id: selectedBoard?.id ?? "",
    };
    this.saveDraft();
  }

  async save(): Promise<void> {
    if (
      !this.form.pin_title?.trim() ||
      !this.form.pin_description?.trim() ||
      !this.form.board_name?.trim() ||
      !this.form.destination_url?.trim() ||
      !this.form.alt_text?.trim()
    ) {
      this.formError.set(
        "Pin title, description, board,alt text and destination URL are required.",
      );
      return;
    }

    if (!this.scheduleDate || !this.scheduleTime) {
      this.formError.set("Schedule date and time are required.");
      return;
    }

    this.formSaving.set(true);
    this.formError.set(null);

    const localTargetDateTime = DateTime.fromISO(
      `${this.scheduleDate}T${this.scheduleTime}`,
      {
        zone: this.targetTimezone,
      },
    );

    const publishAt = localTargetDateTime.toUTC().toISO();

    if (!publishAt) {
      console.error("Failed to convert date to ISO string.");
      return;
    }

    const payload: Partial<PinterestPin> = {
      ...this.form,
      publish_at: publishAt || "",
    };

    console.log("form", this.form);
    console.log("payload", payload);

    try {
      if (this.editingPin()) {
        delete payload.product;

        await this.admin.updatePin(this.editingPin()!.id, payload);
      } else {
        await this.admin.createPin(payload);
      }
      await this.load();
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? "Something went wrong.");
    } finally {
      this.formSaving.set(false);
    }
  }

  confirmDelete(pin: PinterestPin): void {
    this.deleteTarget.set(pin);
  }

  async deletePin(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.admin.deletePin(target.id);
    this.pins.update((list) => list.filter((p) => p.id !== target.id));
    this.deleteTarget.set(null);
  }

  onImageUrlChange(url: string | null): void {
    this.form = { ...this.form, image_url: url ?? "" };
    this.saveDraft();
  }

  onImagePublicIdChange(publicId: string | null): void {
    this.form = {
      ...this.form,
      cloudinary_public_id: publicId ?? "",
    };

    this.saveDraft();
  }
  onDescriptionChange(value: string): void {
    this.form.pin_description = value;
    this.saveDraft();
  }

  onAltTextChange(value: string): void {
    this.form.alt_text = value;
    this.saveDraft();
  }

  onTitleChange(value: string): void {
    this.form.pin_title = value;
    this.saveDraft();
  }

  onDestinationUrlChange(value: string): void {
    this.form.destination_url = value;
    this.saveDraft();
  }

  private saveDraft(): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          image_url: this.form.image_url,
          pin_description: this.form.pin_description,
          alt_text: this.form.alt_text,
          pin_title: this.form.pin_title,
          destination_url: this.form.destination_url,
          cloudinary_public_id: this.form.cloudinary_public_id,
        }),
      );
    } catch {
      // Ignore localStorage errors.
    }
  }

  private getDraftKey(id: string | null): string {
    return id ? `tda-product-form-draft-${id}` : "tda-product-form-draft-new";
  }

  private loadDraft(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        image_url?: string;
        pin_description?: string;
        pin_title?: string;
        destination_url?: string;
        alt_text?: string;
        cloudinary_public_id?: string;
      };
      if (draft.image_url) {
        this.form.image_url = draft.image_url;
      }
      if (draft.pin_description) {
        this.form.pin_description = draft.pin_description;
      }

      if (draft.pin_title) {
        this.form.pin_title = draft.pin_title;
      }

      if (draft.destination_url) {
        this.form.destination_url = draft.destination_url;
      }

      if (draft.alt_text) {
        this.form.alt_text = draft.alt_text;
      }

      if (draft.cloudinary_public_id) {
        this.form.cloudinary_public_id = draft.cloudinary_public_id;
      }
    } catch {
      // Ignore invalid draft data.
    }
  }
}
