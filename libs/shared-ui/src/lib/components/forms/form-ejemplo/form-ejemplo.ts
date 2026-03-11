import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Aceptar, Cancelar } from '@proyectos-dti/shared-ui';

@Component({
  selector: 'lib-form-ejemplo',
  imports: [CommonModule, ReactiveFormsModule, Aceptar, Cancelar],
  templateUrl: './form-ejemplo.html',
  styleUrl: './form-ejemplo.css',
})
export class FormEjemplo {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Formulario enviado:', this.form.value);
      alert('¡Formulario enviado correctamente!');
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  }

  onLimpiar() {
    this.form.reset();
  }

  // Getters para facilitar el acceso en el template
  get nombre() { return this.form.get('nombre'); }
  get mensaje() { return this.form.get('mensaje'); }
}