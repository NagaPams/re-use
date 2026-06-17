import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  email = '';
  confirmEmail = '';
  name = '';
  boleta = '';
  password = '';
  confirmPassword = '';

  emailError = '';
  confirmEmailError = '';
  nameError = '';
  boletaError = '';
  passwordError = '';
  confirmPasswordError = '';
  globalError = '';
  successMessage = '';

  // Password requirements state
  passLengthOk = false;
  passUpperOk = false;
  passLowerOk = false;
  showPasswordStrengthBanner = false;

  private router = inject(Router);
  private mockService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);

  validateName() {
    const nameTrim = this.name.trim();
    if (!nameTrim) {
      this.nameError = 'El nombre completo es obligatorio.';
    } else {
      const parts = nameTrim.split(/\s+/);
      if (parts.length < 3) {
        this.nameError = 'Escribe tu nombre completo (Nombre, Apellido Paterno y Apellido Materno).';
      } else {
        this.nameError = '';
      }
    }
  }

  validateEmail() {
    const emailTrim = this.email.trim();
    if (!emailTrim) {
      this.emailError = 'El correo es obligatorio.';
    } else if (emailTrim.length < 3) {
      this.emailError = 'El correo debe tener al menos 3 caracteres.';
    } else if (emailTrim.includes('@') && !emailTrim.endsWith('@alumno.ipn.mx')) {
      this.emailError = 'El dominio debe ser @alumno.ipn.mx.';
    } else {
      this.emailError = '';
    }
  }

  validateConfirmEmail() {
    const emailTrim = this.email.trim();
    const confirmEmailTrim = this.confirmEmail.trim();
    if (!confirmEmailTrim) {
      this.confirmEmailError = 'La confirmación del correo es obligatoria.';
    } else if (emailTrim !== confirmEmailTrim) {
      this.confirmEmailError = 'Los correos electrónicos no coinciden.';
    } else {
      this.confirmEmailError = '';
    }
  }

  validateBoleta() {
    const boletaTrim = this.boleta.trim();
    if (!boletaTrim) {
      this.boletaError = 'La boleta es obligatoria.';
    } else if (!/^\d+$/.test(boletaTrim)) {
      this.boletaError = 'La boleta debe contener únicamente números.';
    } else {
      this.boletaError = '';
    }
  }

  checkPasswordStrength() {
    const pass = this.password || '';
    this.showPasswordStrengthBanner = pass.length > 0;
    this.passLengthOk = pass.length >= 8;
    this.passUpperOk = /[A-Z]/.test(pass);
    this.passLowerOk = /[a-z]/.test(pass);
  }

  validatePassword() {
    const pass = this.password;
    this.checkPasswordStrength();
    if (!pass) {
      this.passwordError = 'La contraseña es obligatoria.';
    } else if (pass.length < 8) {
      this.passwordError = 'La contraseña debe tener al menos 8 caracteres.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      if (!passwordRegex.test(pass)) {
        this.passwordError = 'La contraseña debe contener mayúsculas y minúsculas.';
      } else {
        this.passwordError = '';
      }
    }
  }

  validateConfirmPassword() {
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'La confirmación de contraseña es obligatoria.';
    } else if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  async onRegister(event: Event) {
    event.preventDefault();
    
    // Run all validations to update UI errors
    this.validateName();
    this.validateEmail();
    this.validateConfirmEmail();
    this.validateBoleta();
    this.validatePassword();
    this.validateConfirmPassword();
    
    this.globalError = '';
    this.successMessage = '';

    if (
      this.nameError ||
      this.emailError ||
      this.confirmEmailError ||
      this.boletaError ||
      this.passwordError ||
      this.confirmPasswordError
    ) {
      return;
    }

    const emailTrim = this.email.trim();
    const nameTrim = this.name.trim();
    const boletaTrim = this.boleta.trim();

    let emailStr = emailTrim;
    if (!emailStr.includes('@')) {
      emailStr = `${emailStr}@alumno.ipn.mx`;
    }

    const parts = nameTrim.split(/\s+/);
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

    try {
      localStorage.setItem('boleta_simulated', boletaTrim);

      await this.mockService.register({
        nombre,
        apellido_paterno,
        apellido_materno,
        correo: emailStr,
        contrasena: this.password,
        boleta: boletaTrim
      });

      // Redirect immediately to login on success
      this.router.navigate(['/login']);
    } catch (err: any) {
      console.error('Register caught error:', err);
      
      // Reset individual errors if we get specific backend duplicate keys
      this.emailError = '';
      this.boletaError = '';
      
      if (err.emailExists && err.boletaExists) {
        this.emailError = 'El correo ya está registrado.';
        this.boletaError = 'La boleta ya está registrada.';
        this.globalError = 'El correo electrónico y la boleta ya están registrados.';
      } else if (err.emailExists) {
        this.emailError = 'El correo ya está registrado.';
        this.globalError = 'El correo ya está registrado.';
      } else if (err.boletaExists) {
        this.boletaError = 'La boleta ya está registrada.';
        this.globalError = 'La boleta ya está registrada.';
      } else {
        // Fallback for general server/network errors
        if (typeof err === 'string') {
          this.globalError = err;
        } else if (err && typeof err.error === 'string') {
          this.globalError = err.error;
          if (err.error.includes('correo')) {
            this.emailError = err.error;
          } else if (err.error.includes('boleta')) {
            this.boletaError = err.error;
          }
        } else if (err && err.response?.data?.error) {
          const errMsg = err.response.data.error;
          this.globalError = errMsg;
          if (errMsg.includes('correo')) {
            this.emailError = errMsg;
          } else if (errMsg.includes('boleta')) {
            this.boletaError = errMsg;
          }
        } else if (err && err.message && err.message.includes('Network Error')) {
          this.globalError = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
        } else if (err && typeof err.message === 'string') {
          this.globalError = err.message;
        } else {
          this.globalError = 'Error al registrar el usuario en el servidor.';
        }
      }
      this.cdr.detectChanges();
    }
  }
}
