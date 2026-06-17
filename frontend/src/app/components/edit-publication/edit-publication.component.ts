import { Component, inject, signal, computed, OnInit, effect, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Article, Specification } from '../../services/mock-data.service';

@Component({
  selector: 'app-edit-publication',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <button (click)="goBack($event)" class="floating-back-btn" title="Volver atrás">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>

    <div class="edit-pub-container">

      <h1 class="page-title">{{ isEditMode() ? 'Editar Publicación' : 'Crear Publicación' }}</h1>

      <form (submit)="onSubmit($event)" class="pub-form">
        <!-- Main Form Layout Grid -->
        <div class="form-layout-grid">
          
          <!-- Left Column -->
          <div class="column-left">
            
            <!-- Card 1: Informacion General -->
            <div class="form-card card-premium">
              <div class="card-header-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" class="header-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <h2>Información General</h2>
              </div>

              <div class="form-group">
                <label for="title">Nombre del Artículo</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title"
                  class="form-control" 
                  placeholder="Campo de entrada"
                  [(ngModel)]="title" 
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="category">Categoría</label>
                  <select id="category" name="category" class="form-control" [(ngModel)]="category" required>
                    <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="state">Estado</label>
                  <select id="state" name="state" class="form-control" [(ngModel)]="state" required>
                    <option *ngFor="let st of states" [value]="st">{{ st }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="description">Descripción</label>
                <textarea 
                  id="description" 
                  name="description"
                  class="form-control text-area" 
                  placeholder="Agregar texto"
                  rows="5"
                  [(ngModel)]="description" 
                  required
                ></textarea>
              </div>
            </div>

            <!-- Card 2: Especificaciones Tecnicas -->
            <div class="form-card card-premium mt-24">
              <div class="card-header-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" class="header-icon">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <h2>Especificaciones Técnicas</h2>
              </div>

              <!-- Specification Rows Inputs -->
              <div class="specs-inputs-container">
                <div class="specs-labels-row">
                  <span>Especificaciones</span>
                  <span>Valores</span>
                  <span class="spacer-col"></span>
                </div>

                <div *ngFor="let spec of specifications; let idx = index" class="spec-input-row">
                  <input 
                    type="text" 
                    class="form-control" 
                    [placeholder]="'Especificación ' + (idx + 1)"
                    [name]="'spec-key-' + idx"
                    [(ngModel)]="spec.key"
                  />
                  <input 
                    type="text" 
                    class="form-control" 
                    [placeholder]="'Valor ' + (idx + 1)"
                    [name]="'spec-val-' + idx"
                    [(ngModel)]="spec.value"
                  />
                  <button type="button" class="btn-remove-spec" (click)="removeSpecification(idx)" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <button type="button" class="btn-secondary btn-add-spec" (click)="addSpecification()">
                Agregar especificación
              </button>
            </div>

          </div>
          
          <!-- Right Column -->
          <div class="column-right">
            
            <!-- Card 3: Imagenes -->
            <div class="form-card card-premium">
              <input 
                type="file" 
                #imageInput 
                (change)="onImageSelected($event)" 
                accept="image/*" 
                multiple 
                style="display: none;" 
              />

              <div class="card-header-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" class="header-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <h2>Imágenes</h2>
              </div>

              <!-- Main image edit panel -->
              <div class="image-edit-panel">
                <div class="image-big-placeholder" [class.has-img]="uploadedImages().length > 0">
                  <img *ngIf="uploadedImages().length > 0; else defaultSvg" [src]="uploadedImages()[activeImageIndex()]" class="main-uploaded-img" />
                  <ng-template #defaultSvg>
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </ng-template>
                </div>
              </div>

              <!-- Sub thumbnails -->
              <div class="image-thumbs-edit-row">
                <div 
                  *ngFor="let img of uploadedImages(); let i = index" 
                  class="thumb-edit-box" 
                  [class.active]="i === activeImageIndex()" 
                  (click)="setActiveImage(i)"
                >
                  <img [src]="img" class="thumb-img" />
                  <button type="button" class="btn-delete-thumb" (click)="removeImage(i, $event)" title="Eliminar imagen">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <!-- Display default empty slots if we have fewer than 3 thumbnails -->
                <ng-container *ngIf="uploadedImages().length === 0">
                  <div class="thumb-edit-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div class="thumb-edit-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div class="thumb-edit-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                </ng-container>

                <button type="button" class="btn-thumb-add" (click)="imageInput.click()">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Card 4: Precio / Disponibilidad -->
            <div class="form-card card-premium mt-24">
              <div class="card-header-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" class="header-icon">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h2>Precio y Stock</h2>
              </div>

              <div class="form-group">
                <label for="acquisitionType">Tipo de Venta</label>
                <select id="acquisitionType" name="acquisitionType" class="form-control" [(ngModel)]="acquisitionType" required>
                  <option value="Venta">Venta</option>
                  <option value="Donación">Donación</option>
                  <option value="Intercambio">Intercambio</option>
                </select>
              </div>

              <!-- Price field - only show/enable if acquisitionType is 'Venta' -->
              <div class="form-group" [class.disabled]="acquisitionType !== 'Venta'">
                <label for="price">Precio de Venta</label>
                <div class="price-input-wrapper">
                  <span class="currency-symbol">$</span>
                  <input 
                    type="number" 
                    id="price" 
                    name="price"
                    class="form-control price-control" 
                    placeholder="150.00"
                    [(ngModel)]="price"
                    [disabled]="acquisitionType !== 'Venta'"
                    min="0"
                  />
                  <span class="currency-code">MXN</span>
                </div>
              </div>

              <div class="form-group">
                <label for="stock">Stock Disponible</label>
                <input 
                  type="number" 
                  id="stock" 
                  name="stock"
                  class="form-control" 
                  placeholder="2"
                  [(ngModel)]="stock" 
                  required
                  min="1"
                />
              </div>
            </div>

            <!-- Submit buttons row -->
            <div class="action-buttons-row">
              <button type="submit" class="btn-accent btn-large-submit">
                {{ isEditMode() ? 'Actualizar' : 'Publicar' }}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  `,
  styles: [`
    .floating-back-btn {
      position: fixed;
      top: 100px;
      left: 40px;
      z-index: 99;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: all var(--transition-fast);
    }
    .floating-back-btn:hover {
      background: var(--primary-color);
      color: white;
      transform: scale(1.08);
      box-shadow: var(--shadow-lg);
    }
    @media (max-width: 1200px) {
      .floating-back-btn {
        left: 16px;
        top: 90px;
        width: 40px;
        height: 40px;
      }
    }

    .edit-pub-container {
      padding-top: 10px;
    }

    .page-title {
      font-size: 2.2rem;
      margin-bottom: 32px;
      font-weight: 800;
    }

    .form-layout-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .form-layout-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-card {
      padding: 32px;
      border-radius: var(--border-radius-md);
    }

    .mt-24 {
      margin-top: 24px;
    }

    .card-premium h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .card-header-icon {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      color: var(--primary-color);
    }

    .header-icon {
      color: var(--primary-color);
    }

    .text-area {
      resize: vertical;
    }

    /* Images upload */
    .image-edit-panel {
      width: 100%;
      height: 240px;
      background: #f1f5f9;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .image-big-placeholder {
      color: #94a3b8;
    }

    .btn-change-main-img {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary-color);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      transition: all var(--transition-fast);
    }

    .btn-change-main-img:hover {
      background: var(--primary-color-hover);
      transform: scale(1.08);
    }

    .image-thumbs-edit-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr) 48px;
      gap: 12px;
    }

    .thumb-edit-box {
      height: 70px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      cursor: pointer;
    }

    .btn-thumb-add {
      height: 70px;
      border: 2px dashed var(--border-color);
      background: #ffffff;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-thumb-add:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--primary-color-light);
    }

    .main-uploaded-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .image-big-placeholder.has-img {
      width: 100%;
      height: 100%;
    }

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--border-radius-sm);
      display: block;
    }

    .thumb-edit-box {
      position: relative;
    }

    .thumb-edit-box.active {
      border-color: var(--accent-color);
      border-width: 2.5px;
    }

    .btn-delete-thumb {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ef4444;
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: all var(--transition-fast);
      z-index: 5;
    }

    .btn-delete-thumb:hover {
      background: #dc2626;
      transform: scale(1.1);
    }

    /* Specs Input dynamic list */
    .specs-inputs-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .specs-labels-row {
      display: grid;
      grid-template-columns: 1fr 1fr 40px;
      gap: 16px;
      font-weight: 700;
      color: var(--primary-color);
      font-size: 0.9rem;
    }

    .spec-input-row {
      display: grid;
      grid-template-columns: 1fr 1fr 40px;
      gap: 16px;
      align-items: center;
    }

    .btn-remove-spec {
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius-sm);
      border: 1px solid #fca5a5;
      background: #fef2f2;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-remove-spec:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #f87171;
    }

    .btn-add-spec {
      width: 100%;
      padding: 10px;
    }

    /* Pricing */
    .price-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-symbol {
      position: absolute;
      left: 16px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .price-control {
      padding-left: 32px;
      padding-right: 64px;
    }

    .currency-code {
      position: absolute;
      right: 16px;
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .form-group.disabled {
      opacity: 0.5;
    }

    /* Actions Submit */
    .action-buttons-row {
      margin-top: 32px;
    }

    .btn-large-submit {
      width: 100%;
      padding: 16px;
      font-size: 1.1rem;
    }
  `]
})
export class EditPublicationComponent implements OnInit {
  mockService = inject(MockDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  goBack(event: Event) {
    event.preventDefault();
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  // Form states details
  articleId = signal<string | null>(null);
  
  title = '';
  category = 'Módulos y Sensores';
  state = 'Nuevo';
  description = '';
  acquisitionType: 'Venta' | 'Donación' | 'Intercambio' = 'Venta';
  price = 0;
  stock = 1;
  specifications: Specification[] = [
    { key: '', value: '' },
    { key: '', value: '' }
  ];

  // Choices details
  categories = [
    'Semiconductores',
    'Pasivos',
    'Tarjetas de desarrollo',
    'Módulos y Sensores',
    'Herramientas y Equipo',
    'Kits Completos'
  ];

  states = ['Nuevo', 'Casi Nuevo', 'Usado'];

  isEditMode = signal(false);
  uploadedImages = signal<string[]>([]);
  activeImageIndex = signal<number>(0);
  selectedFiles: File[] = [];

  private lastLoadedArticleId: string | null = null;

  constructor() {
    effect(() => {
      const pubs = this.mockService.publications();
      const id = this.articleId();
      if (this.isEditMode() && id) {
        if (pubs.length > 0) {
          const art = pubs.find(p => p.id === id);
          if (art) {
            if (id !== this.lastLoadedArticleId) {
              this.lastLoadedArticleId = id;
              this.title = art.title;
              this.category = art.category;
              this.state = art.state;
              this.description = art.description;
              this.acquisitionType = art.acquisitionType;
              this.price = art.price;
              this.stock = art.stock;
              this.specifications = art.specifications.length 
                ? JSON.parse(JSON.stringify(art.specifications)) // deep copy
                : [{ key: '', value: '' }];
              
              if (art.images && art.images.length > 0 && (art.images[0].startsWith('data:') || art.images[0].startsWith('http'))) {
                this.uploadedImages.set([...art.images]);
              } else {
                this.uploadedImages.set([]);
              }
              this.activeImageIndex.set(0);
              this.cdr.detectChanges();
            }
          } else {
            // Truly not found in a populated list, redirect
            this.router.navigate(['/profile']);
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Check if ID is provided in route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleId.set(id);
      this.isEditMode.set(true);
    }
  }

  addSpecification() {
    this.specifications.push({ key: '', value: '' });
  }

  removeSpecification(index: number) {
    this.specifications.splice(index, 1);
    if (this.specifications.length === 0) {
      this.specifications.push({ key: '', value: '' });
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      this.selectedFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        this.uploadedImages.set([...this.uploadedImages(), url]);
        // Set as active if it's the first image uploaded
        if (this.uploadedImages().length === 1) {
          this.activeImageIndex.set(0);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear value to allow re-upload of same files
    input.value = '';
  }

  setActiveImage(index: number) {
    this.activeImageIndex.set(index);
  }

  removeImage(index: number, event: Event) {
    event.stopPropagation(); // stop click event from selecting this thumb
    const current = [...this.uploadedImages()];
    const removedImg = current[index];
    
    if (removedImg.startsWith('data:')) {
      // Find the corresponding file index in selectedFiles
      let fileIndex = 0;
      for (let i = 0; i < index; i++) {
        if (current[i].startsWith('data:')) {
          fileIndex++;
        }
      }
      this.selectedFiles.splice(fileIndex, 1);
    }
    
    current.splice(index, 1);
    this.uploadedImages.set(current);
    
    // Adjust active index
    if (this.activeImageIndex() >= current.length) {
      this.activeImageIndex.set(Math.max(0, current.length - 1));
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.title || !this.category || !this.state || !this.description || !this.stock) return;

    // Filter empty specifications
    const cleanSpecs = this.specifications.filter(s => s.key.trim() && s.value.trim());

    // Force price to 0 if not selling
    const finalPrice = this.acquisitionType === 'Venta' ? this.price : 0;

    try {
      const currentId = this.articleId();
      if (this.isEditMode() && currentId) {
        // Compute which existing images are kept (not newly uploaded base64 data URLs)
        const keptImages = this.uploadedImages().filter(img => !img.startsWith('data:'));
        const keptRelativePaths = keptImages.map(img => img.replace('http://localhost:3000', ''));
        const mantenerFotos = keptRelativePaths.join(',');

        // Edit mode
        await this.mockService.updatePublication(currentId, {
          title: this.title,
          category: this.category,
          state: this.state as any,
          description: this.description,
          acquisitionType: this.acquisitionType,
          price: finalPrice,
          stock: this.stock,
          specifications: cleanSpecs,
          mantener_fotos: mantenerFotos
        } as any, this.selectedFiles);
        alert('Publicación actualizada con éxito.');
      } else {
        // Create mode
        await this.mockService.addPublication({
          title: this.title,
          category: this.category,
          state: this.state as any,
          description: this.description,
          acquisitionType: this.acquisitionType,
          price: finalPrice,
          stock: this.stock,
          specifications: cleanSpecs
        }, this.selectedFiles);
        alert('Publicación creada con éxito.');
      }
      // Go back to profile
      this.router.navigate(['/profile']);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Hubo un error al procesar la publicación: ${errMsg}`);
    }
  }
}
