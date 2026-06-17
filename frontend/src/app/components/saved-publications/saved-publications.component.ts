import { Component, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService, Article } from '../../services/mock-data.service';

@Component({
  selector: 'app-saved-publications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="saved-container">
      <h1 class="page-title">Publicaciones Guardadas</h1>

      <div *ngIf="mockService.savedPublications().length === 0; else savedList" class="empty-state card-premium">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3>No tienes publicaciones guardadas</h3>
        <p>Explora el catálogo y guarda componentes que necesites para tus proyectos escolares.</p>
        <button routerLink="/catalog" class="btn-primary">Ver catálogo</button>
      </div>

      <ng-template #savedList>
        <div class="saved-grid">
          <div *ngFor="let item of mockService.savedPublications()" class="saved-row card-premium">
            
            <!-- Left image -->
            <div class="saved-img" [routerLink]="['/product', item.id]" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img *ngIf="item.images && item.images[0] && (item.images[0].startsWith('data:') || item.images[0].startsWith('http')); else savedDefaultSvg" [src]="item.images[0]" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--border-radius-sm);" alt="Foto del componente" />
              <ng-template #savedDefaultSvg>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </ng-template>
            </div>

            <!-- Middle details -->
            <div class="saved-details">
              <h3 class="saved-title" [routerLink]="['/product', item.id]">{{ item.title }}</h3>
              <p class="saved-seller">Vendedor: {{ item.sellerName }}</p>
              
              <div class="stars">
                <svg 
                  *ngFor="let star of [1,2,3,4,5]" 
                  [class.filled]="star <= item.sellerReputation"
                  viewBox="0 0 24 24" 
                  width="14" 
                  height="14" 
                  fill="currentColor"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span class="rep-text">{{ item.sellerReputation }}</span>
              </div>
            </div>

            <!-- Price/Acquisition -->
            <div class="saved-financials">
              <div class="type-cell">
                <span class="lbl">Tipo de Adquisición:</span>
                <span class="val" [class]="item.acquisitionType.toLowerCase()">{{ item.acquisitionType }}</span>
              </div>
              <div class="price-cell">
                <span class="price-val" *ngIf="item.acquisitionType === 'Venta'">\${{ item.price | number:'1.2-2' }}</span>
                <span class="price-val free" *ngIf="item.acquisitionType === 'Donación'">Gratis</span>
                <span class="price-val swap" *ngIf="item.acquisitionType === 'Intercambio'">Trueque</span>
              </div>
            </div>

            <!-- Right operations -->
            <div class="saved-actions">
              <!-- Filled Bookmark representing active saved state -->
              <button 
                (click)="mockService.toggleSave(item.id)" 
                class="btn-bookmark active-saved"
                title="Quitar de guardados"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>

              <button (click)="contactSeller(item)" class="btn-contact-link">
                Contactar Vendedor
              </button>
            </div>

          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .saved-container {
      padding-top: 10px;
    }

    .page-title {
      font-size: 2.2rem;
      margin-bottom: 24px;
      font-weight: 800;
    }

    .saved-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .saved-row {
      display: grid;
      grid-template-columns: 140px 1.5fr 1fr auto;
      align-items: center;
      gap: 24px;
      padding: 24px;
      border-radius: var(--border-radius-md);
      transition: all var(--transition-normal);
    }

    .saved-row:hover {
      transform: translateX(4px);
    }

    @media (max-width: 768px) {
      .saved-row {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
        gap: 16px;
      }
    }

    .saved-img {
      height: 100px;
      background: #f1f5f9;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .saved-img {
        width: 140px;
      }
    }

    .saved-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .saved-title {
      font-size: 1.3rem;
      font-weight: 700;
      cursor: pointer;
    }

    .saved-title:hover {
      color: var(--accent-color);
    }

    .saved-seller {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .stars {
      display: flex;
      align-items: center;
      gap: 2px;
      color: #cbd5e1;
    }

    .stars svg.filled {
      color: var(--star-color);
    }

    .rep-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-left: 6px;
    }

    .saved-financials {
      display: flex;
      justify-content: space-around;
      gap: 16px;
    }

    @media (max-width: 768px) {
      .saved-financials {
        width: 100%;
        margin: 8px 0;
      }
    }

    .type-cell {
      display: flex;
      flex-direction: column;
    }

    .type-cell .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .type-cell .val {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .type-cell .val.venta { color: var(--primary-color); }
    .type-cell .val.donación { color: var(--heart-color); }
    .type-cell .val.intercambio { color: var(--exchange-color); }

    .price-cell {
      display: flex;
      align-items: center;
    }

    .price-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--accent-color);
      font-family: var(--font-heading);
    }

    .price-val.free { color: var(--heart-color); }
    .price-val.swap { color: var(--exchange-color); }

    .saved-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .saved-actions {
        align-items: center;
        width: 100%;
      }
    }

    .btn-bookmark.active-saved {
      background: var(--accent-color-light);
      color: var(--accent-color);
      border: none;
      border-radius: var(--border-radius-sm);
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-bookmark.active-saved:hover {
      background: #fee2e2;
      color: #ef4444;
      transform: scale(1.05);
    }

    .btn-contact-link {
      background: transparent;
      border: none;
      color: var(--accent-color);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      font-family: var(--font-heading);
      transition: color var(--transition-fast);
    }

    .btn-contact-link:hover {
      color: var(--accent-color-hover);
      text-decoration: underline;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 40px;
      color: var(--text-muted);
    }

    .empty-icon {
      color: #94a3b8;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 1.4rem;
      margin-bottom: 8px;
      color: var(--primary-color);
    }

    .empty-state p {
      max-width: 400px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
  `]
})
export class SavedPublicationsComponent {
  mockService = inject(MockDataService);
  private router = inject(Router);

  async contactSeller(article: Article) {
    const chatId = await this.mockService.startChat(article.id);
    this.router.navigate(['/messages'], { queryParams: { active: chatId } });
  }
}
