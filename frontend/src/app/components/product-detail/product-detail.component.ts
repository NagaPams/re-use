import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MockDataService, Article } from '../../services/mock-data.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <button (click)="goBack($event)" class="floating-back-btn" title="Volver atrás">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>

    <div *ngIf="article(); else notFound" class="product-detail-container">
      <!-- Back Link / Categories -->
      <div class="breadcrumb">
        <a routerLink="/catalog" class="back-link">Catálogo</a>
        <span class="separator">/</span>
        <span class="current-category">{{ article()?.category }}</span>
      </div>

      <!-- Main Columns -->
      <div class="product-main-grid">
        <!-- Left: Image Gallery -->
        <div class="gallery-column">
          <!-- Main Image -->
          <div class="main-image-card card-premium">
            <div class="image-placeholder" [class.has-img]="article()?.images && article()!.images[activeImageIndex()] && (article()!.images[activeImageIndex()].startsWith('data:') || article()!.images[activeImageIndex()].startsWith('http'))">
              <img *ngIf="article()?.images && article()!.images[activeImageIndex()] && (article()!.images[activeImageIndex()].startsWith('data:') || article()!.images[activeImageIndex()].startsWith('http')); else detailDefaultSvg" [src]="article()!.images[activeImageIndex()]" class="detail-uploaded-img" alt="Imagen del componente" />
              <ng-template #detailDefaultSvg>
                <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </ng-template>
            </div>
            <span class="state-badge" [class]="article()?.state?.toLowerCase()?.replace(' ', '-')">
              {{ article()?.state }}
            </span>
          </div>

          <!-- Thumbnails -->
          <div class="thumbnails-row">
            <ng-container *ngIf="article()?.images && article()!.images[0] && (article()!.images[0].startsWith('data:') || article()!.images[0].startsWith('http')); else defaultThumbnails">
              <div 
                *ngFor="let img of article()?.images; let i = index" 
                class="thumb-card" 
                [class.active]="i === activeImageIndex()"
                (click)="setActiveImage(i)"
              >
                <img [src]="img" class="thumb-img" />
              </div>
            </ng-container>
            
            <ng-template #defaultThumbnails>
              <div class="thumb-card active">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div class="thumb-card">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div class="thumb-card">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </ng-template>

            <button class="btn-thumb-add" *ngIf="article()?.sellerEmail === mockService.currentUser()?.email" [routerLink]="['/edit-publication', article()?.id]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right: Information -->
        <div class="info-column">
          <div class="info-card card-premium">
            <!-- Title & Bookmark -->
            <div class="title-row">
              <h1 class="product-title">{{ article()?.title }}</h1>
              
              <button 
                [class.saved]="mockService.isSaved(article()!.id)" 
                (click)="mockService.toggleSave(article()!.id)"
                class="btn-bookmark"
                [title]="mockService.isSaved(article()!.id) ? 'Quitar de guardados' : 'Guardar publicación'"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>

            <!-- Description -->
            <p class="product-description">{{ article()?.description }}</p>

            <!-- Seller Info -->
            <div class="seller-profile-row">
              <div class="seller-details">
                <p class="seller-label">Vendedor:</p>
                <p class="seller-name">{{ article()?.sellerName }}</p>
                <p class="seller-email">{{ article()?.sellerEmail }}</p>
              </div>

              <div class="seller-rating">
                <div class="stars">
                  <svg 
                    *ngFor="let star of [1,2,3,4,5]" 
                    [class.filled]="star <= article()!.sellerReputation"
                    viewBox="0 0 24 24" 
                    width="16" 
                    height="16" 
                    fill="currentColor"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <span class="rep-text">{{ article()?.sellerReputation }} estrellas</span>
              </div>
            </div>

            <!-- Price & Stock Grid -->
            <div class="deal-metrics">
              <div class="metric-box">
                <span class="metric-label">Tipo de Adquisición:</span>
                <span class="metric-value acquisition" [class]="article()?.acquisitionType?.toLowerCase()">
                  {{ article()?.acquisitionType }}
                </span>
              </div>

              <div class="metric-box" *ngIf="article()?.acquisitionType === 'Venta'">
                <span class="metric-label">Precio fijo:</span>
                <span class="metric-value price">\${{ article()?.price | number:'1.2-2' }}</span>
              </div>

              <div class="metric-box">
                <span class="metric-label">Disponibles:</span>
                <span class="metric-value stock">{{ article()?.stock }} uds</span>
              </div>
            </div>

            <!-- Technical Specifications -->
            <div class="specifications-section">
              <div class="spec-section-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" class="spec-icon">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="23"></line>
                  <line x1="15" y1="20" x2="15" y2="23"></line>
                  <line x1="20" y1="9" x2="23" y2="9"></line>
                  <line x1="20" y1="15" x2="23" y2="15"></line>
                  <line x1="1" y1="9" x2="4" y2="9"></line>
                  <line x1="1" y1="15" x2="4" y2="15"></line>
                </svg>
                <h3>Especificaciones Técnicas</h3>
              </div>

              <table class="specifications-table">
                <tbody>
                  <tr *ngFor="let spec of article()?.specifications">
                    <td class="spec-key">{{ spec.key }}</td>
                    <td class="spec-value">{{ spec.value }}</td>
                  </tr>
                  <tr *ngIf="!article()?.specifications?.length">
                    <td colspan="2" class="no-specs">No se indicaron especificaciones técnicas.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Contact Seller Action Button -->
            <button (click)="contactSeller()" class="btn-accent btn-contact-seller">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Contactar Vendedor
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom: Related Products -->
      <section class="related-section">
        <h2 class="section-title">Artículos Relacionados</h2>
        
        <div class="related-grid">
          <div 
            *ngFor="let item of relatedArticles()" 
            [routerLink]="['/product', item.id]" 
            class="related-card card-premium"
          >
            <div class="related-img-placeholder">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            
            <div class="related-info">
              <h4 class="related-title">{{ item.title }}</h4>
              <p class="related-seller">Vendedor: {{ item.sellerName }}</p>
              
              <div class="related-footer">
                <span class="related-type" [class]="item.acquisitionType.toLowerCase()">{{ item.acquisitionType }}</span>
                <span class="related-price" *ngIf="item.acquisitionType === 'Venta'">\${{ item.price | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <ng-template #notFound>
      <div class="not-found-container container">
        <div class="card-premium error-card">
          <h2>Artículo no encontrado</h2>
          <p>El artículo que buscas no existe o ha sido retirado.</p>
          <button (click)="goBack($event)" class="btn-primary">Volver atrás</button>
        </div>
      </div>
    </ng-template>
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

    .product-detail-container {
      padding-top: 10px;
    }

    /* Breadcrumbs */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      margin-bottom: 24px;
      color: var(--text-muted);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent-color);
      font-weight: 600;
    }

    .back-link:hover {
      color: var(--accent-color-hover);
    }

    .separator {
      color: #cbd5e1;
    }

    .current-category {
      font-weight: 500;
    }

    /* Main Grid */
    .product-main-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 32px;
      margin-bottom: 48px;
    }

    @media (max-width: 900px) {
      .product-main-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Gallery Column */
    .gallery-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .main-image-card {
      width: 100%;
      height: 380px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 0;
      overflow: hidden;
      border-radius: var(--border-radius-md);
    }

    .image-placeholder {
      color: #94a3b8;
    }

    .state-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 0.8rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
    }

    .state-badge.nuevo { background-color: var(--accent-color); }
    .state-badge.casi-nuevo { background-color: #3498db; }
    .state-badge.usado { background-color: #7f8c8d; }

    .thumbnails-row {
      display: grid;
      grid-template-columns: repeat(3, 80px) 48px;
      gap: 12px;
    }

    .thumb-card {
      height: 80px;
      background: #ffffff;
      border: 1.5px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #94a3b8;
      transition: all var(--transition-fast);
    }

    .thumb-card:hover, .thumb-card.active {
      border-color: var(--accent-color);
      color: var(--accent-color);
      background: var(--accent-color-light);
    }

    .detail-uploaded-img {
      width: 100%;
      height: 380px;
      object-fit: cover;
      display: block;
      border-radius: var(--border-radius-md);
    }

    .image-placeholder.has-img {
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

    .btn-thumb-add {
      height: 80px;
      background: #ffffff;
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .btn-thumb-add:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--primary-color-light);
    }

    /* Info Column */
    .info-column {
      display: flex;
      flex-direction: column;
    }

    .info-card {
      padding: 32px;
      border-radius: var(--border-radius-md);
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: var(--shadow-md);
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .product-title {
      font-size: 2.2rem;
      line-height: 1.2;
      font-weight: 800;
    }

    .btn-bookmark {
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #94a3b8;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .btn-bookmark:hover {
      background: var(--primary-color-light);
      color: var(--primary-color);
    }

    .btn-bookmark.saved {
      background: var(--accent-color-light);
      color: var(--accent-color);
    }

    .product-description {
      color: var(--text-muted);
      line-height: 1.6;
      font-size: 1.05rem;
    }

    /* Seller Info */
    .seller-profile-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 16px;
      background: #f8fafc;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
      align-items: center;
      gap: 16px;
    }

    @media (max-width: 480px) {
      .seller-profile-row {
        grid-template-columns: 1fr;
      }
    }

    .seller-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .seller-name {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--primary-color);
    }

    .seller-email {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .seller-rating {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    @media (max-width: 480px) {
      .seller-rating {
        align-items: flex-start;
      }
    }

    .stars {
      display: flex;
      gap: 2px;
      color: #e2e8f0;
    }

    .stars svg.filled {
      color: var(--star-color);
    }

    .rep-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Deal Metrics */
    .deal-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }

    .metric-box {
      border: 1px solid var(--border-color);
      padding: 16px;
      border-radius: var(--border-radius-sm);
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #ffffff;
    }

    .metric-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .metric-value {
      font-size: 1.3rem;
      font-weight: 800;
      font-family: var(--font-heading);
    }

    .metric-value.acquisition.venta { color: var(--primary-color); }
    .metric-value.acquisition.donación { color: var(--heart-color); }
    .metric-value.acquisition.intercambio { color: var(--exchange-color); }

    .metric-value.price {
      color: var(--accent-color);
    }

    .metric-value.stock {
      color: var(--text-main);
    }

    /* Specifications Section */
    .specifications-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }

    .spec-section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-color);
    }

    .spec-icon {
      color: var(--primary-color);
    }

    .spec-section-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .specifications-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
    }

    .specifications-table td {
      padding: 12px 16px;
      font-size: 0.95rem;
      border-bottom: 1px solid var(--border-color);
    }

    .specifications-table tr:last-child td {
      border-bottom: none;
    }

    .specifications-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .spec-key {
      font-weight: 700;
      color: var(--primary-color);
      width: 40%;
    }

    .spec-value {
      color: var(--text-main);
    }

    .no-specs {
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Contact Button */
    .btn-contact-seller {
      width: 100%;
      padding: 14px;
      font-size: 1.1rem;
      margin-top: 10px;
    }

    /* Related Section */
    .related-section {
      border-top: 1px solid var(--border-color);
      padding-top: 40px;
    }

    .section-title {
      font-size: 1.6rem;
      margin-bottom: 24px;
      font-weight: 700;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }

    .related-card {
      display: flex;
      flex-direction: column;
      padding: 0;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .related-card:hover {
      transform: translateY(-4px);
    }

    .related-img-placeholder {
      height: 120px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .related-info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-grow: 1;
    }

    .related-title {
      font-size: 0.95rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .related-seller {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .related-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }

    .related-type {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .related-type.venta { color: var(--primary-color); }
    .related-type.donación { color: var(--heart-color); }
    .related-type.intercambio { color: var(--exchange-color); }

    .related-price {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--accent-color);
    }

    /* Error details */
    .not-found-container {
      display: flex;
      justify-content: center;
      padding: 80px 0;
    }

    .error-card {
      text-align: center;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }
  `]
})
export class ProductDetailComponent {
  mockService = inject(MockDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  goBack(event: Event) {
    event.preventDefault();
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/catalog']);
    }
  }

  // Active thumbnail gallery index
  activeImageIndex = signal<number>(0);

  setActiveImage(index: number) {
    this.activeImageIndex.set(index);
  }

  // Load article reactively based on route param id
  article = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return null;
    return this.mockService.publications().find(p => p.id === id) || null;
  });

  // Calculate related articles from the same category
  relatedArticles = computed(() => {
    const current = this.article();
    if (!current) return [];
    
    return this.mockService.publications().filter(
      p => p.category === current.category && p.id !== current.id
    ).slice(0, 4);
  });

  async contactSeller() {
    const current = this.article();
    if (!current) return;

    // Start a chat conversation
    const chatId = await this.mockService.startChat(current.id);
    
    // Redirect to messages view and set target chat
    this.router.navigate(['/messages'], { queryParams: { active: chatId } });
  }
}
