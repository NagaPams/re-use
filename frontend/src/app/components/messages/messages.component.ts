import { Component, inject, signal, computed, OnInit, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Chat, Message } from '../../services/mock-data.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-container">
      <h1 class="page-title">Mensajes</h1>

      <div class="messages-layout card-premium">
        
        <!-- Left Sidebar: Chat List -->
        <aside class="chats-sidebar">
          
          <!-- Section 1: Con Clientes -->
          <div class="chats-group">
            <h3 class="group-title">Con Clientes</h3>
            <div *ngIf="customerChats().length === 0" class="no-chats-msg">No hay chats con clientes.</div>
            <div class="chats-list">
              <div 
                *ngFor="let chat of customerChats()" 
                [class.active]="activeChatId() === chat.id"
                (click)="selectChat(chat.id)"
                class="chat-card"
              >
                <div class="chat-avatar">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="chat-card-info">
                  <p class="partner-name"><strong>Alumno:</strong> {{ chat.partnerName }}</p>
                  <p class="article-title"><strong>Artículo:</strong> {{ chat.articleTitle }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Con Vendedores -->
          <div class="chats-group mt-24">
            <h3 class="group-title">Con Vendedores</h3>
            <div *ngIf="sellerChats().length === 0" class="no-chats-msg">No hay chats con vendedores.</div>
            <div class="chats-list">
              <div 
                *ngFor="let chat of sellerChats()" 
                [class.active]="activeChatId() === chat.id"
                (click)="selectChat(chat.id)"
                class="chat-card"
              >
                <div class="chat-avatar">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="chat-card-info">
                  <p class="partner-name"><strong>Alumno:</strong> {{ chat.partnerName }}</p>
                  <p class="article-title"><strong>Artículo:</strong> {{ chat.articleTitle }}</p>
                </div>
              </div>
            </div>
          </div>

        </aside>

        <!-- Right Side: Active Chat Box -->
        <main class="chat-box-area">
          <div *ngIf="activeChat(); else emptyChatState" class="active-chat-box">
            
            <!-- Chat Header -->
            <div class="chat-header">
              <div class="header-details">
                <h2 class="chat-article-name">{{ activeChat()?.articleTitle }}</h2>
                <p class="chat-partner-subtitle">{{ activeChat()?.partnerRole }}: {{ activeChat()?.partnerName }}</p>
              </div>
              <button (click)="closeChat()" class="btn-close-chat" title="Cerrar conversación">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Chat Messages Scroll List -->
            <div class="chat-messages-container" #scrollContainer>
              <div 
                *ngFor="let msg of activeChat()?.messages" 
                class="message-bubble-wrapper"
                [class.my-message]="msg.sender === 'me'"
                [class.partner-message]="msg.sender === 'partner'"
              >
                <div class="message-bubble">
                  <!-- File Attachment Image -->
                  <div *ngIf="msg.fileType === 'image'" class="msg-attachment-wrapper">
                    <img [src]="msg.fileUrl" class="chat-img-attachment" alt="Imagen adjunta" />
                  </div>
                  <!-- File Attachment PDF -->
                  <div *ngIf="msg.fileType === 'pdf'" class="msg-attachment-wrapper">
                    <a [href]="msg.fileUrl" [download]="msg.fileName" class="pdf-attachment-card">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <div class="pdf-meta">
                        <span class="pdf-name" [title]="msg.fileName">{{ msg.fileName }}</span>
                        <span class="pdf-size">Documento PDF</span>
                      </div>
                    </a>
                  </div>
                  <p class="msg-text" *ngIf="msg.text">{{ msg.text }}</p>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
              </div>
              
              <div *ngIf="activeChat()?.messages?.length === 0" class="no-messages">
                <p>No hay mensajes en esta conversación. ¡Inicia el contacto!</p>
              </div>
            </div>

            <!-- Message Input Bar -->
            <form (submit)="onSendMessage($event)" class="message-input-bar">
              <input 
                type="file" 
                #fileInput 
                (change)="onFileSelected($event)" 
                accept="image/*,application/pdf" 
                style="display: none;" 
              />
              
              <button type="button" class="btn-attach" (click)="fileInput.click()" title="Adjuntar archivo o imagen">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              
              <input 
                type="text" 
                class="form-control message-input" 
                placeholder="Mensaje" 
                name="messageText"
                [(ngModel)]="messageText" 
                required
                autocomplete="off"
              />

              <button type="submit" class="btn-send" title="Enviar mensaje">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="send-icon">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>

          </div>

          <!-- Empty State (Page 8) -->
          <ng-template #emptyChatState>
            <div class="empty-chat-state">
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1" class="empty-chat-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3>Ninguna conversación seleccionada</h3>
              <p>Selecciona un chat del listado lateral o contacta a un vendedor desde el catálogo para iniciar una conversación.</p>
            </div>
          </ng-template>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      padding-top: 10px;
    }

    .page-title {
      font-size: 2.2rem;
      margin-bottom: 24px;
      font-weight: 800;
    }

    .messages-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - 200px);
      min-height: 500px;
      padding: 0;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .messages-layout {
        grid-template-columns: 1fr;
      }
      .chats-sidebar {
        display: block;
      }
      .chat-box-area {
        display: none;
      }
      .messages-layout.chat-open .chats-sidebar {
        display: none;
      }
      .messages-layout.chat-open .chat-box-area {
        display: block;
      }
    }

    /* Sidebar list */
    .chats-sidebar {
      border-right: 1px solid var(--border-color);
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
    }

    .chats-group {
      display: flex;
      flex-direction: column;
    }

    .group-title {
      font-size: 1.05rem;
      margin-bottom: 12px;
      color: var(--primary-color);
      font-weight: 800;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
    }

    .no-chats-msg {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
      padding: 8px 12px;
    }

    .chats-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .chat-card {
      display: grid;
      grid-template-columns: 40px 1fr;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .chat-card:hover {
      background: var(--primary-color-light);
      border-color: var(--primary-color);
    }

    .chat-card.active {
      background: var(--accent-color-light);
      border-color: var(--accent-color);
      box-shadow: var(--shadow-sm);
    }

    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      border: 1px solid var(--border-color);
    }

    .chat-card.active .chat-avatar {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }

    .chat-card-info {
      font-size: 0.85rem;
      color: var(--text-main);
      overflow: hidden;
    }

    .partner-name, .article-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .partner-name strong, .article-title strong {
      color: var(--primary-color);
    }

    .mt-24 {
      margin-top: 24px;
    }

    /* Active Chat Box */
    .chat-box-area {
      overflow: hidden;
      background: #ffffff;
      height: 100%;
    }

    .active-chat-box {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: #ffffff;
      box-shadow: var(--shadow-sm);
      z-index: 10;
    }

    .chat-article-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .chat-partner-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .btn-close-chat {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #ef4444;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-close-chat:hover {
      background: #fee2e2;
      color: #dc2626;
      transform: scale(1.05);
    }

    /* Messages Scroll Container */
    .chat-messages-container {
      flex-grow: 1;
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-bubble-wrapper {
      display: flex;
      width: 100%;
    }

    .message-bubble {
      max-width: 70%;
      padding: 12px 18px;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }

    .my-message {
      justify-content: flex-end;
    }

    .my-message .message-bubble {
      background: var(--primary-color);
      color: white;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
    }

    .partner-message {
      justify-content: flex-start;
    }

    .partner-message .message-bubble {
      background: white;
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }

    .msg-text {
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .msg-time {
      font-size: 0.75rem;
      align-self: flex-end;
      opacity: 0.7;
    }

    .no-messages {
      text-align: center;
      color: var(--text-muted);
      margin: auto;
      font-style: italic;
    }

    /* Input Message bar */
    .message-input-bar {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      background: #ffffff;
      align-items: center;
    }

    .btn-attach {
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      width: 44px;
      height: 44px;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .btn-attach:hover {
      background: var(--primary-color-light);
      color: var(--primary-color);
    }

    .message-input {
      flex-grow: 1;
      padding: 12px 16px;
      font-size: 0.95rem;
    }

    .btn-send {
      background: var(--accent-color);
      border: none;
      color: white;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(10, 136, 138, 0.2);
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .btn-send:hover {
      background: var(--accent-color-hover);
      transform: scale(1.05);
    }

    .send-icon {
      transform: translate(-1px, 1px);
    }

    /* Empty Chat box state */
    .empty-chat-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 100%;
      padding: 40px;
      color: var(--text-muted);
      background: #f8fafc;
    }

    .empty-chat-icon {
      color: #cbd5e1;
      margin-bottom: 16px;
    }

    .empty-chat-state h3 {
      font-size: 1.4rem;
      margin-bottom: 8px;
      color: var(--primary-color);
    }

    .empty-chat-state p {
      max-width: 420px;
      line-height: 1.5;
    }

    .msg-attachment-wrapper {
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .chat-img-attachment {
      max-width: 100%;
      max-height: 200px;
      border-radius: var(--border-radius-sm);
      display: block;
      cursor: pointer;
      border: 1px solid rgba(0,0,0,0.15);
    }

    .pdf-attachment-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      color: var(--text-main);
      transition: all var(--transition-fast);
      max-width: 260px;
      text-decoration: none;
    }

    .my-message .pdf-attachment-card {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: white;
    }

    .pdf-attachment-card:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .my-message .pdf-attachment-card:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.35);
    }

    .pdf-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-align: left;
    }

    .pdf-name {
      font-size: 0.85rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pdf-size {
      font-size: 0.7rem;
      opacity: 0.8;
    }
  `]
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  mockService = inject(MockDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeChatId = signal<string | null>(null);
  messageText = '';

  private initialLoad = true;

  constructor() {
    effect(() => {
      const list = this.mockService.chats();
      const activeParam = this.activeChatId();
      if (this.initialLoad && list.length > 0) {
        const urlParam = this.route.snapshot.queryParams['active'];
        if (urlParam) {
          this.activeChatId.set(urlParam);
        } else {
          this.activeChatId.set(list[0].id);
        }
        this.initialLoad = false;
      }
    }, { allowSignalWrites: true });
  }

  // Get active chat from master list
  activeChat = computed(() => {
    const id = this.activeChatId();
    if (!id) return null;
    return this.mockService.chats().find(c => c.id === id) || null;
  });

  // Chats con clientes
  customerChats = computed(() => {
    return this.mockService.chats().filter(c => c.partnerRole === 'Cliente');
  });

  // Chats con vendedores
  sellerChats = computed(() => {
    return this.mockService.chats().filter(c => c.partnerRole === 'Vendedor');
  });

  ngOnInit() {
    // Check if query params has active chat
    this.route.queryParams.subscribe(params => {
      const activeParam = params['active'];
      if (activeParam) {
        this.activeChatId.set(activeParam);
        this.initialLoad = false;
      } else if (!this.initialLoad) {
        this.activeChatId.set(null);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  selectChat(id: string) {
    this.activeChatId.set(id);
    // Update route params silently
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { active: id },
      queryParamsHandling: 'merge'
    });
  }

  closeChat() {
    this.activeChatId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { active: null },
      queryParamsHandling: 'merge'
    });
  }

  onSendMessage(event: Event) {
    event.preventDefault();
    const id = this.activeChatId();
    if (!id || !this.messageText.trim()) return;

    this.mockService.sendMessage(id, this.messageText.trim());
    this.messageText = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileName = file.name;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert('Solo se admiten archivos PDF o imágenes.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const chatId = this.activeChatId();
      if (chatId) {
        this.mockService.sendMessage(
          chatId,
          '',
          isImage ? 'image' : 'pdf',
          fileUrl,
          fileName
        );
      }
    };
    reader.readAsDataURL(file);

    // Clear value to allow re-upload of same file
    input.value = '';
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}
