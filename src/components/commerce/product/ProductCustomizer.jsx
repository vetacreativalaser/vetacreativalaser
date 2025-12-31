/**
 * PRODUCT CUSTOMIZER - Veta Creativa Láser
 *
 * Motor de formularios dinámicos que renderiza campos de personalización
 * basados en la configuración JSONB de Supabase (custom_fields).
 *
 * Soporta: text, textarea, select, number
 * Validación en tiempo real de campos requeridos
 */

import { useEffect } from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

/**
 * @typedef {Object} CustomField
 * @property {string} label - Etiqueta del campo
 * @property {'text'|'textarea'|'select'|'number'} type - Tipo de input
 * @property {boolean} required - Si es obligatorio
 * @property {string[]} [options] - Opciones para tipo 'select'
 * @property {string} [placeholder] - Placeholder opcional
 * @property {number} [min] - Valor mínimo para tipo 'number'
 * @property {number} [max] - Valor máximo para tipo 'number'
 */

/**
 * ProductCustomizer Component
 *
 * @param {Object} props
 * @param {CustomField[]} props.customFields - Configuración de campos desde Supabase
 * @param {Object} props.values - Valores actuales del formulario (controlled)
 * @param {Function} props.onValuesChange - Callback (values, isValid) => void
 * @returns {JSX.Element|null}
 */
export default function ProductCustomizer({ customFields, values, onValuesChange }) {
  /**
   * Effect: Notificar al padre si no hay campos válidos
   * Se ejecuta ANTES de cualquier renderizado
   */
  useEffect(() => {
    // Validar que customFields sea un array válido
    if (!customFields || !Array.isArray(customFields) || customFields.length === 0) {
      // Sin campos: notificar que es válido y no hay nada que validar
      onValuesChange({}, true);
      return;
    }

    // Si hay campos válidos, validar los valores actuales
    const isValid = validateFields(values);
    onValuesChange(values, isValid);
  }, [customFields]); // Solo re-validar si cambia la configuración

  /**
   * Validación temprana: Si no hay campos o no es un array, no renderizar nada
   */
  if (!customFields || !Array.isArray(customFields) || customFields.length === 0) {
    return null;
  }

  /**
   * Valida si todos los campos requeridos están completos
   */
  const validateFields = (currentValues) => {
    return customFields.every(field => {
      if (!field.required) return true;

      const value = currentValues[field.label];

      // Validar según tipo
      if (field.type === 'select') {
        return value && value.trim() !== '';
      }

      if (field.type === 'number') {
        return value !== undefined && value !== null && value !== '';
      }

      // text, textarea
      return value && value.trim() !== '';
    });
  };

  /**
   * Handler para cambios en los campos
   */
  const handleFieldChange = (fieldLabel, newValue) => {
    const updatedValues = {
      ...values,
      [fieldLabel]: newValue
    };

    const isValid = validateFields(updatedValues);
    onValuesChange(updatedValues, isValid);
  };

  /**
   * Renderiza un campo individual según su tipo
   */
  const renderField = (field) => {
    const value = values[field.label] || '';
    const fieldId = `custom-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`;

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
            required={field.required}
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
            required={field.required}
            className="w-full min-h-[100px] resize-y"
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            placeholder={field.placeholder || '0'}
            required={field.required}
            min={field.min}
            max={field.max}
            className="w-full"
          />
        );

      case 'select':
        if (!field.options || field.options.length === 0) {
          console.warn(`Field "${field.label}" is type 'select' but has no options`);
          return (
            <div className="text-sm text-muted-foreground italic">
              Sin opciones configuradas
            </div>
          );
        }

        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.label, newValue)}
            required={field.required}
          >
            <SelectTrigger id={fieldId} className="w-full">
              <SelectValue placeholder={field.placeholder || 'Selecciona una opción'} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        console.warn(`Unknown field type: ${field.type}`);
        return (
          <div className="text-sm text-muted-foreground italic">
            Tipo de campo no soportado: {field.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header de sección */}
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Personalización</h3>
        <p className="text-sm text-muted-foreground">
          Completa los campos para personalizar tu producto
        </p>
      </div>

      {/* Campos dinámicos */}
      <div className="space-y-4">
        {customFields.map((field, index) => (
          <div key={`${field.label}-${index}`} className="space-y-2">
            <Label
              htmlFor={`custom-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium"
            >
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1" aria-label="Campo obligatorio">
                  *
                </span>
              )}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Mensaje de ayuda para campos obligatorios */}
      {customFields.some(f => f.required) && (
        <p className="text-xs text-muted-foreground mt-4">
          <span className="text-destructive">*</span> Campos obligatorios
        </p>
      )}
    </div>
  );
}
