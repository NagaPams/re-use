import { Component, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Article } from '../../services/mock-data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="profile-container">
      <h1 class="page-title">Mi Perfil</h1>

      <!-- Top Profile Overview Box -->
      <div class="profile-overview card-premium">
        <div class="avatar-container">
          <input 
            type="file" 
            #avatarInput 
            (change)="onAvatarSelected($event)" 
            accept="image/*" 
            style="display: none;" 
          />
          <div class="avatar-circle" (click)="avatarInput.click()" style="cursor: pointer;">
            <img *ngIf="mockService.currentUser()?.avatarUrl; else defaultAvatarSvg" [src]="mockService.currentUser()?.avatarUrl" class="user-avatar-img" alt="Foto de perfil" />
            <ng-template #defaultAvatarSvg>
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </ng-template>
            <button class="btn-avatar-edit" (click)="$event.stopPropagation(); avatarInput.click()" title="Editar foto de perfil">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="profile-headers">
          <h2 class="user-display-name">{{ mockService.currentUser()?.name }}</h2>
          <p class="user-display-email">{{ mockService.currentUser()?.email }}</p>
        </div>

        <div class="profile-reputation">
          <span class="rep-label">Reputación:</span>
          <div class="stars">
            <svg 
              *ngFor="let star of [1,2,3,4,5]" 
              [class.filled]="star <= (mockService.currentUser()?.reputation || 5)"
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="currentColor"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span class="rep-value">{{ mockService.currentUser()?.reputation }} / 5</span>
        </div>
      </div>

      <!-- Update forms (Left: details, Right: password) -->
      <div class="forms-grid">
        <!-- Personal Details -->
        <div class="form-box card-premium">
          <form (submit)="onUpdateDetails($event)">
            <div class="form-group">
              <label for="profile-name">Nombre:</label>
              <input 
                type="text" 
                id="profile-name" 
                name="name"
                class="form-control" 
                [(ngModel)]="name" 
                required
              />
            </div>

            <div class="form-group">
              <label for="profile-boleta">Boleta:</label>
              <input 
                type="text" 
                id="profile-boleta" 
                name="boleta"
                class="form-control" 
                [(ngModel)]="boleta" 
                required
              />
            </div>

            <div class="form-group">
              <label for="profile-phone">No. Telefónico:</label>
              <input 
                type="text" 
                id="profile-phone" 
                name="phone"
                class="form-control" 
                [(ngModel)]="phone" 
                required
              />
            </div>

            <button type="submit" class="btn-primary btn-update">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="update-icon">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              Actualizar
            </button>
          </form>
        </div>

        <!-- Password Change -->
        <div class="form-box card-premium">
          <form (submit)="onUpdatePassword($event)">
            <div class="form-group">
              <label for="profile-pass">Contraseña:</label>
              <input 
                type="password" 
                id="profile-pass" 
                name="currentPassword"
                class="form-control" 
                placeholder="Ingresa contraseña actual"
                [(ngModel)]="currentPassword" 
                required
              />
            </div>

            <div class="form-group">
              <label for="profile-new-pass">Nueva Contraseña:</label>
              <input 
                type="password" 
                id="profile-new-pass" 
                name="newPassword"
                class="form-control" 
                placeholder="Ingresa nueva contraseña"
                [(ngModel)]="newPassword" 
                required
              />
            </div>

            <div class="form-group">
              <label for="profile-confirm-pass">Confirmar Contraseña:</label>
              <input 
                type="password" 
                id="profile-confirm-pass" 
                name="confirmPassword"
                class="form-control" 
                placeholder="Confirma nueva contraseña"
                [(ngModel)]="confirmPassword" 
                required
              />
            </div>

            <button type="submit" class="btn-primary btn-update">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="update-icon">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              Actualizar
            </button>
          </form>
        </div>
      </div>

      <!-- Success Toasts -->
      <div *ngIf="showToast()" class="success-toast">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-check">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ toastMessage() }}</span>
      </div>

      <!-- User Publications list -->
      <section class="user-pubs-section">
        <h2 class="section-title">Mis Publicaciones</h2>

        <div *ngIf="userPublications().length === 0" class="empty-state card-premium">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <h3>Aún no has publicado componentes</h3>
          <p>Comparte piezas sobrantes con otros compañeros publicándolas hoy mismo.</p>
          <button routerLink="/create-publication" class="btn-accent">Publicar Componente</button>
        </div>

        <div class="pubs-list">
          <div *ngFor="let item of userPublications()" class="pub-row card-premium">
            <div class="pub-img-placeholder" [routerLink]="['/product', item.id]" style="cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img *ngIf="item.images && item.images[0] && (item.images[0].startsWith('data:') || item.images[0].startsWith('http')); else profileDefaultSvg" [src]="item.images[0]" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto del componente" />
              <ng-template #profileDefaultSvg>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </ng-template>
            </div>

            <div class="pub-main-info">
              <h3 class="pub-title" [routerLink]="['/product', item.id]">{{ item.title }}</h3>
              <p class="pub-seller">Vendedor: {{ item.sellerName }}</p>
              
              <div class="stars">
                <svg 
                  *ngFor="let star of [1,2,3,4,5]" 
                  [class.filled]="star <= item.sellerReputation"
                  viewBox="0 0 24 24" 
                  width="12" 
                  height="12" 
                  fill="currentColor"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>

            <div class="pub-financials">
              <div class="pub-type-cell">
                <span class="lbl">Tipo de Adquisición:</span>
                <span class="val" [class]="item.acquisitionType.toLowerCase()">{{ item.acquisitionType }}</span>
              </div>
              
              <div class="pub-price-cell">
                <span class="price-val" *ngIf="item.acquisitionType === 'Venta'">\${{ item.price | number:'1.2-2' }}</span>
                <span class="price-val donation" *ngIf="item.acquisitionType === 'Donación'">Gratis</span>
                <span class="price-val swap" *ngIf="item.acquisitionType === 'Intercambio'">Trueque</span>
              </div>
            </div>

            <div class="pub-actions">
              <button [routerLink]="['/edit-publication', item.id]" class="btn-secondary btn-edit">
                Editar Publicación
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Confirmation Modal -->
      <div *ngIf="showConfirmModal()" class="modal-overlay">
        <div class="confirm-modal card-premium">
          <div class="modal-header-details">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" class="modal-warning-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h2>¿Confirmar actualización?</h2>
          </div>
          
          <p class="modal-body-text">
            Se aplicarán y guardarán los cambios realizados en tu perfil de usuario. ¿Deseas continuar?
          </p>

          <div class="modal-actions-row">
            <button type="button" class="btn-secondary" (click)="cancelUpdate()">
              Cancelar
            </button>
            <button type="button" class="btn-accent" (click)="confirmUpdate()">
              Sí, actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding-top: 10px;
    }

    .page-title {
      font-size: 2.2rem;
      margin-bottom: 24px;
      font-weight: 800;
    }

    /* Profile Overview */
    .profile-overview {
      display: grid;
      grid-template-columns: 100px 1fr auto;
      align-items: center;
      gap: 24px;
      margin-bottom: 32px;
      padding: 30px;
    }

    @media (max-width: 768px) {
      .profile-overview {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
      }
    }

    .avatar-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border: 1px solid var(--border-color);
      color: #94a3b8;
    }

    .user-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }

    .btn-avatar-edit {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      transition: all var(--transition-fast);
    }

    .btn-avatar-edit:hover {
      background: var(--primary-color-hover);
      transform: scale(1.08);
    }

    .profile-headers {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-display-name {
      font-size: 1.6rem;
      font-weight: 800;
    }

    .user-display-email {
      font-size: 0.95rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .profile-reputation {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    @media (max-width: 768px) {
      .profile-reputation {
        align-items: center;
      }
    }

    .rep-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stars {
      display: flex;
      gap: 2px;
      color: #e2e8f0;
    }

    .stars svg.filled {
      color: var(--star-color);
    }

    .rep-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Forms Grid */
    .forms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 48px;
    }

    @media (max-width: 900px) {
      .forms-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-box {
      padding: 32px;
      border-radius: var(--border-radius-md);
    }

    .btn-update {
      width: 100%;
      margin-top: 10px;
      gap: 10px;
    }

    .update-icon {
      transition: transform 0.5s ease;
    }

    .btn-update:hover .update-icon {
      transform: rotate(180deg);
    }

    /* User Publications Row list */
    .user-pubs-section {
      border-top: 1px solid var(--border-color);
      padding-top: 40px;
    }

    .section-title {
      font-size: 1.8rem;
      margin-bottom: 24px;
      font-weight: 700;
    }

    .pubs-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pub-row {
      display: grid;
      grid-template-columns: 80px 1.5fr 1fr auto;
      align-items: center;
      gap: 24px;
      padding: 20px;
      border-radius: var(--border-radius-md);
      transition: all var(--transition-normal);
    }

    .pub-row:hover {
      transform: translateX(4px);
    }

    @media (max-width: 768px) {
      .pub-row {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
        gap: 16px;
      }
    }

    .pub-img-placeholder {
      height: 80px;
      background: #f1f5f9;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    @media (max-width: 768px) {
      .pub-img-placeholder {
        width: 120px;
      }
    }

    .pub-main-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pub-title {
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
    }

    .pub-title:hover {
      color: var(--accent-color);
    }

    .pub-seller {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .pub-financials {
      display: flex;
      justify-content: space-around;
      gap: 16px;
    }

    @media (max-width: 768px) {
      .pub-financials {
        width: 100%;
        margin: 8px 0;
      }
    }

    .pub-type-cell {
      display: flex;
      flex-direction: column;
    }

    .pub-type-cell .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .pub-type-cell .val {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .pub-type-cell .val.venta { color: var(--primary-color); }
    .pub-type-cell .val.donación { color: var(--heart-color); }
    .pub-type-cell .val.intercambio { color: var(--exchange-color); }

    .pub-price-cell {
      display: flex;
      align-items: center;
    }

    .price-val {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--accent-color);
    }

    .price-val.donation { color: var(--heart-color); }
    .price-val.swap { color: var(--exchange-color); }

    .btn-edit {
      padding: 10px 16px;
      font-size: 0.9rem;
    }

    /* Success toast */
    .success-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--primary-color);
      color: white;
      padding: 16px 24px;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: fadeInUp 0.3s ease;
    }

    .toast-check {
      color: var(--accent-color-light);
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

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: modalFadeIn 0.25s ease;
    }

    .confirm-modal {
      width: 100%;
      max-width: 440px;
      padding: 32px;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-lg);
      text-align: center;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: modalScaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .modal-header-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--primary-color);
    }

    .modal-warning-icon {
      color: var(--accent-color);
    }

    .modal-body-text {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .modal-actions-row {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 12px;
      margin-top: 10px;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ProfileComponent {
  mockService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);

  // Form Fields details
  name = '';
  boleta = '';
  phone = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Toast notifications details
  showToast = signal(false);
  toastMessage = signal('');

  // Confirmation Modal details
  showConfirmModal = signal(false);
  pendingAction: (() => void) | null = null;

  private lastLoadedUserId: number | null | undefined = undefined;

  constructor() {
    effect(() => {
      const user = this.mockService.currentUser();
      if (user && user.id !== this.lastLoadedUserId) {
        this.lastLoadedUserId = user.id;
        this.name = user.name;
        this.boleta = user.boleta;
        this.phone = user.phone;
        this.cdr.detectChanges();
      } else if (!user) {
        this.lastLoadedUserId = null;
        this.name = '';
        this.boleta = '';
        this.phone = '';
        this.cdr.detectChanges();
      }
    }, { allowSignalWrites: true });
  }

  // Calculate publications belonging to this user
  userPublications = computed(() => {
    const user = this.mockService.currentUser();
    if (!user) return [];
    return this.mockService.publications().filter(
      p => p.sellerEmail === user.email
    );
  });

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.pendingAction = async () => {
        try {
          await this.mockService.updateUserProfile({}, file);
          this.triggerToast('Foto de perfil actualizada correctamente.');
          this.cdr.detectChanges();
        } catch (err) {
          alert('Error al actualizar el avatar.');
          this.cdr.detectChanges();
        }
      };
      this.showConfirmModal.set(true);
    };
    reader.readAsDataURL(file);

    // Clear value
    input.value = '';
  }

  onUpdateDetails(event: Event) {
    event.preventDefault();
    if (!this.name || !this.boleta || !this.phone) return;

    this.pendingAction = async () => {
      try {
        await this.mockService.updateUserProfile({
          name: this.name,
          boleta: this.boleta,
          phone: this.phone
        });
        this.triggerToast('Datos personales actualizados correctamente.');
        this.cdr.detectChanges();
      } catch (err) {
        alert('Error al actualizar el perfil.');
        this.cdr.detectChanges();
      }
    };
    this.showConfirmModal.set(true);
  }

  onUpdatePassword(event: Event) {
    event.preventDefault();
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    this.pendingAction = async () => {
      try {
        await this.mockService.updatePassword(this.currentPassword, this.newPassword);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.triggerToast('Contraseña actualizada correctamente.');
        this.cdr.detectChanges();
      } catch (err: any) {
        alert(err.error || 'La contraseña actual es incorrecta.');
        this.cdr.detectChanges();
      }
    };
    this.showConfirmModal.set(true);
  }

  confirmUpdate() {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.showConfirmModal.set(false);
  }

  cancelUpdate() {
    this.pendingAction = null;
    this.showConfirmModal.set(false);
  }

  private triggerToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
