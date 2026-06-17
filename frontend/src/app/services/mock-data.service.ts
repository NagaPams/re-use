import { Injectable, signal, computed, effect } from '@angular/core';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Axios request interceptor to auto-inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Specification {
  key: string;
  value: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  sellerName: string;
  sellerEmail: string;
  sellerReputation: number;
  acquisitionType: 'Venta' | 'Donación' | 'Intercambio';
  price: number;
  stock: number;
  category: string;
  state: 'Nuevo' | 'Casi Nuevo' | 'Usado' | 'Vendido' | 'Entregado';
  images: string[];
  specifications: Specification[];
}

export interface Message {
  sender: 'me' | 'partner';
  text: string;
  time: string;
  fileType?: 'image' | 'pdf';
  fileUrl?: string;
  fileName?: string;
}

export interface Chat {
  id: string;
  articleId: string;
  articleTitle: string;
  partnerName: string;
  partnerRole: 'Vendedor' | 'Cliente' | 'Comprador';
  messages: Message[];
}

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  boleta: string;
  phone: string;
  reputation: number;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Current user state (logged in user details)
  currentUser = signal<UserProfile | null>(null);

  // Global search query for sharing between header and components
  searchQuery = signal<string>('');

  // Master list of electronic components (publications)
  publications = signal<Article[]>([]);

  // Saved publications (bookmarks) - stores Article IDs
  savedIds = signal<Set<string>>(new Set());

  // Chat conversations
  chats = signal<Chat[]>([]);

  private socket: any;

  constructor() {
    // Try to load auth details on start
    this.initSession();

    // Load public catalog publications
    this.loadPublications();

    // Sync saved items and chats when user logs in
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.loadSavedPublications();
        this.loadChats();
      } else {
        this.savedIds.set(new Set());
        this.chats.set([]);
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
      }
    });
  }

  async initSession() {
    const token = localStorage.getItem('token');
    if (token) {
      await this.loadProfile();
    }
  }

  async login(correo: string, contrasena: string): Promise<any> {
    try {
      const res = await api.post('/api/auth/login', { correo, contrasena });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      this.currentUser.set({
        id: user.id,
        name: user.nombre + (user.apellidos ? ' ' + user.apellidos : ''),
        email: user.correo,
        boleta: user.boleta || '',
        phone: user.telefono || '',
        reputation: 5.0,
      });

      this.connectSocket(user.id);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async register(data: { nombre: string; apellido_paterno: string; apellido_materno: string; correo: string; contrasena: string; boleta: string }): Promise<any> {
    try {
      const res = await api.post('/api/auth/register', data);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }

  async loadProfile() {
    try {
      const res = await api.get('/api/profile');
      const data = res.data;
      this.currentUser.set({
        id: data.id,
        name: data.nombre + (data.apellidos ? ' ' + data.apellidos : ''),
        email: data.correo,
        boleta: data.boleta || '',
        phone: data.telefono || '',
        reputation: parseFloat(data.reputacion) || 5.0,
        avatarUrl: data.avatarUrl ? `${API_BASE_URL}${data.avatarUrl}` : undefined,
      });

      this.connectSocket(data.id);
    } catch (error) {
      console.error('Failed to load user profile, logging out:', error);
      this.logout();
    }
  }

  connectSocket(userId: number) {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = io(API_BASE_URL);

    this.socket.on('connect', () => {
      console.log('Socket.io connection established for user', userId);
      this.socket.emit('register_user', userId);
    });

    this.socket.on('nuevo_mensaje', (data: any) => {
      console.log('Realtime message received:', data);
      // Reload chat inbox to stay updated
      this.loadChats();
    });
  }

  async loadPublications() {
    try {
      const res = await api.get('/api/publications');
      const articles = res.data.map((p: any) => this.mapProductToArticle(p));
      this.publications.set(articles);
    } catch (error) {
      console.error('Error loading publications:', error);
    }
  }

  async loadSavedPublications() {
    try {
      const res = await api.get('/api/saved');
      const ids = res.data.map((item: any) => item.id_producto.toString());
      this.savedIds.set(new Set(ids));
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  }

  async loadChats() {
    try {
      const res = await api.get('/api/chats');
      // Format messages in each chat
      const formattedChats: Chat[] = res.data.map((c: any) => {
        return {
          id: c.id,
          articleId: c.articleId,
          articleTitle: c.articleTitle,
          partnerName: c.partnerName,
          partnerRole: c.partnerRole,
          messages: c.messages.map((m: any) => ({
            sender: m.sender,
            text: m.text,
            time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileType: m.fileType,
            fileUrl: m.fileUrl,
            fileName: m.fileName
          }))
        };
      });
      this.chats.set(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  private mapProductToArticle(p: any): Article {
    let descriptionText = p.descripcion || '';
    let specifications: Specification[] = [];
    if (descriptionText.includes(' || ')) {
      const parts = descriptionText.split(' || ');
      descriptionText = parts[0];
      try {
        specifications = JSON.parse(parts[1]);
      } catch (e) {
        // Ignored
      }
    }

    let mappedState: any = 'Nuevo';
    if (p.estado === 'Usado') mappedState = 'Usado';
    else if (p.estado === 'Casi Nuevo') mappedState = 'Casi Nuevo';
    else if (p.estado === 'Vendido') mappedState = 'Vendido';
    else if (p.estado === 'Entregado') mappedState = 'Entregado';

    return {
      id: p.id_producto.toString(),
      title: p.titulo,
      description: descriptionText,
      sellerName: p.vendedor || 'Usuario',
      sellerEmail: p.correo_institucional || '',
      sellerReputation: parseFloat(p.reputacion_vendedor) || 4.5,
      acquisitionType: p.tipo_adquisicion || 'Venta',
      price: parseFloat(p.precio) || 0,
      stock: p.stock || 1,
      category: p.categoria || 'Componentes',
      state: mappedState,
      images: p.fotos ? [`${API_BASE_URL}${p.fotos}`] : ['generic_hardware'],
      specifications: specifications,
    };
  }

  savedPublications = computed(() => {
    const ids = this.savedIds();
    return this.publications().filter(p => ids.has(p.id));
  });

  // Actions
  async toggleSave(articleId: string) {
    const current = new Set(this.savedIds());
    const isSaved = current.has(articleId);

    try {
      if (isSaved) {
        await api.delete(`/api/saved/${articleId}`);
        current.delete(articleId);
      } else {
        await api.post(`/api/saved/${articleId}`);
        current.add(articleId);
      }
      this.savedIds.set(current);
    } catch (error) {
      console.error('Failed to toggle save status:', error);
    }
  }

  isSaved(articleId: string): boolean {
    return this.savedIds().has(articleId);
  }

  async addPublication(article: Omit<Article, 'id' | 'sellerName' | 'sellerEmail' | 'sellerReputation' | 'images'>, imageFile?: File) {
    try {
      // Map category name to database ID
      const catId = article.category === 'Herramientas y Equipo' ? 2 : 1;
      
      const formData = new FormData();
      formData.append('titulo', article.title);
      formData.append('descripcion', article.description + ' || ' + JSON.stringify(article.specifications));
      formData.append('precio', article.price.toString());
      formData.append('estado', article.state);
      formData.append('tipo_adquisicion', article.acquisitionType);
      formData.append('stock', article.stock.toString());
      formData.append('id_categoria', catId.toString());
      
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      await api.post('/api/publications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await this.loadPublications();
    } catch (error) {
      console.error('Failed to add publication:', error);
      throw error;
    }
  }

  async updatePublication(articleId: string, updatedFields: Partial<Article>) {
    try {
      const catId = updatedFields.category === 'Herramientas y Equipo' ? 2 : 1;
      const desc = updatedFields.description + (updatedFields.specifications ? ' || ' + JSON.stringify(updatedFields.specifications) : '');
      
      await api.put(`/api/publications/${articleId}`, {
        titulo: updatedFields.title,
        descripcion: desc,
        precio: updatedFields.price,
        estado: updatedFields.state,
        tipo_adquisicion: updatedFields.acquisitionType,
        stock: updatedFields.stock,
        id_categoria: catId
      });
      
      await this.loadPublications();
    } catch (error) {
      console.error('Failed to update publication:', error);
      throw error;
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>, avatarFile?: File) {
    try {
      // Split name into nombre and apellidos for backend
      if (profile.name) {
        const parts = profile.name.trim().split(/\s+/);
        let nombre = parts[0] || '';
        let apellido_paterno = parts[1] || '';
        let apellido_materno = parts.slice(2).join(' ') || '';
        
        if (parts.length === 4) {
          nombre = `${parts[0]} ${parts[1]}`;
          apellido_paterno = parts[2];
          apellido_materno = parts[3];
        } else if (parts.length > 4) {
          nombre = parts.slice(0, parts.length - 2).join(' ');
          apellido_paterno = parts[parts.length - 2];
          apellido_materno = parts[parts.length - 1];
        }

        await api.put('/api/profile', {
          nombre,
          apellido_paterno,
          apellido_materno,
          telefono: profile.phone
        });
      } else if (profile.phone) {
        await api.put('/api/profile', {
          telefono: profile.phone
        });
      }

      if (profile.boleta) {
        localStorage.setItem('boleta_simulated', profile.boleta);
      }

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.put('/api/profile/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      await this.loadProfile();
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    try {
      await api.put('/api/profile/password', { currentPassword, newPassword });
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async sendMessage(chatId: string, text: string, fileType?: 'image' | 'pdf', fileUrl?: string, fileName?: string) {
    try {
      const numericChatId = chatId.replace('chat_', '');
      let finalText = text;
      if (fileType) {
        finalText = `[Adjunto: ${fileName || fileType}] ${text || ''}`.trim();
      }
      await api.post(`/api/chats/${numericChatId}/messages`, { text: finalText });
      await this.loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  async startChat(articleId: string): Promise<string> {
    try {
      const res = await api.post('/api/chats', { articleId: parseInt(articleId) });
      const newChatId = `chat_${res.data.chatId}`;
      await this.loadChats();
      return newChatId;
    } catch (error) {
      console.error('Failed to start chat:', error);
      return '';
    }
  }
}
