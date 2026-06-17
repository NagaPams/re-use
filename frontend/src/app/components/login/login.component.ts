import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})

export class LoginComponent {
  email = '';
  password = '';

  errorMessage = '';

  private router = inject(Router);
  private mockService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);

  async onLogin(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    const emailTrim = this.email.trim();
    const passwordTrim = this.password.trim();

    if (!emailTrim) {
      this.errorMessage = 'El correo es obligatorio.';
      return;
    }

    if (!passwordTrim) {
      this.errorMessage = 'La contraseña es obligatoria.';
      return;
    }

    // Check for pocos caracteres
    const parts = emailTrim.split('@');
    const localPart = parts[0];
    if (localPart.length < 3) {
      this.errorMessage = 'El correo debe tener al menos 3 caracteres.';
      return;
    }

    if (passwordTrim.length < 4) {
      this.errorMessage = 'La contraseña debe tener al menos 4 caracteres.';
      return;
    }

    // Check domain
    let emailStr = emailTrim;
    if (!emailStr.includes('@')) {
      emailStr = `${emailStr}@alumno.ipn.mx`;
    }

    if (!emailStr.endsWith('@alumno.ipn.mx')) {
      this.errorMessage = 'El dominio del correo es incorrecto. Debe ser @alumno.ipn.mx.';
      return;
    }

    try {
      await this.mockService.login(emailStr, passwordTrim);
      sessionStorage.setItem('show_welcome_modal', 'true');
      this.router.navigate(['/catalog']);
    } catch (err: any) {
      console.error('Login caught error:', err);
      if (typeof err === 'string') {
        this.errorMessage = err;
      } else if (err && typeof err.error === 'string') {
        this.errorMessage = err.error;
      } else if (err && err.response?.data?.error) {
        this.errorMessage = err.response.data.error;
      } else if (err && err.message && err.message.includes('Network Error')) {
        this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
      } else if (err && typeof err.message === 'string') {
        this.errorMessage = err.message;
      } else {
        this.errorMessage = 'Credenciales incorrectas o cuenta no registrada.';
      }
      this.cdr.detectChanges();
    }
  }
}
