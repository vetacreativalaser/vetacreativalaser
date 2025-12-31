import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Trash2,
  GripVertical,
  Type,
  ListOrdered,
  FileImage,
  ToggleLeft,
  Euro
} from 'lucide-react';

/**
 * CustomizationTab - Builder visual para custom_fields
 *
 * Permite al admin construir el formulario que verá el cliente
 * en ProductCustomizer.
 *
 * Tipos de campo:
 * - text: Texto corto
 * - textarea: Texto largo
 * - select: Selector/Dropdown
 * - file: Archivo (imágenes/vectores)
 * - boolean: Checkbox Sí/No
 *
 * Configuración por campo:
 * - label: Etiqueta visible
 * - placeholder: Texto de ayuda
 * - required: Campo obligatorio
 * - extraCost: Coste adicional (se suma al precio base)
 * - options: Opciones (solo para select)
 */
const CustomizationTab = ({ formData, updateField }) => {
  const [expandedField, setExpandedField] = useState(null);

  // Añadir nuevo campo
  const addField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      extraCost: 0,
      options: [] // Solo para select
    };

    updateField('custom_fields', [...(formData.custom_fields || []), newField]);
    setExpandedField(newField.id);
  };

  // Actualizar campo específico
  const updateCustomField = (fieldId, property, value) => {
    const updatedFields = formData.custom_fields.map(field =>
      field.id === fieldId
        ? { ...field, [property]: value }
        : field
    );

    updateField('custom_fields', updatedFields);
  };

  // Eliminar campo
  const removeField = (fieldId) => {
    updateField('custom_fields', formData.custom_fields.filter(f => f.id !== fieldId));
    if (expandedField === fieldId) {
      setExpandedField(null);
    }
  };

  // Mover campo arriba
  const moveFieldUp = (index) => {
    if (index === 0) return;
    const fields = [...formData.custom_fields];
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    updateField('custom_fields', fields);
  };

  // Mover campo abajo
  const moveFieldDown = (index) => {
    if (index === formData.custom_fields.length - 1) return;
    const fields = [...formData.custom_fields];
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    updateField('custom_fields', fields);
  };

  // Añadir opción a campo select
  const addSelectOption = (fieldId) => {
    const field = formData.custom_fields.find(f => f.id === fieldId);
    if (!field) return;

    const newOptions = [...(field.options || []), ''];
    updateCustomField(fieldId, 'options', newOptions);
  };

  // Actualizar opción de select
  const updateSelectOption = (fieldId, optionIndex, value) => {
    const field = formData.custom_fields.find(f => f.id === fieldId);
    if (!field) return;

    const newOptions = [...field.options];
    newOptions[optionIndex] = value;
    updateCustomField(fieldId, 'options', newOptions);
  };

  // Eliminar opción de select
  const removeSelectOption = (fieldId, optionIndex) => {
    const field = formData.custom_fields.find(f => f.id === fieldId);
    if (!field) return;

    const newOptions = field.options.filter((_, i) => i !== optionIndex);
    updateCustomField(fieldId, 'options', newOptions);
  };

  // Iconos por tipo de campo
  const fieldTypeIcons = {
    text: Type,
    textarea: Type,
    select: ListOrdered,
    file: FileImage,
    boolean: ToggleLeft
  };

  const fieldTypeLabels = {
    text: 'Texto corto',
    textarea: 'Texto largo',
    select: 'Selector',
    file: 'Archivo',
    boolean: 'Sí/No'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Constructor de Formulario de Personalización
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Añade campos personalizables que los clientes verán al comprar este producto
          </p>
        </div>
        <Button
          type="button"
          onClick={addField}
          size="sm"
          className="bg-black text-white hover:bg-gray-800"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Campo
        </Button>
      </div>

      {/* Lista de campos */}
      {formData.custom_fields && formData.custom_fields.length > 0 ? (
        <div className="space-y-3">
          {formData.custom_fields.map((field, index) => {
            const FieldIcon = fieldTypeIcons[field.type] || Type;
            const isExpanded = expandedField === field.id;

            return (
              <div
                key={field.id}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Header del campo */}
                <div
                  className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedField(isExpanded ? null : field.id)}
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <FieldIcon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {field.label || 'Campo sin nombre'}
                      </span>
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                          Obligatorio
                        </span>
                      )}
                      {field.extraCost > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          +{field.extraCost}€
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {fieldTypeLabels[field.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveFieldUp(index);
                      }}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveFieldDown(index);
                      }}
                      disabled={index === formData.custom_fields.length - 1}
                      className="h-8 w-8"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                      }}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Configuración del campo (expandible) */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo de campo */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Tipo de campo</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateCustomField(field.id, 'type', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto corto</SelectItem>
                            <SelectItem value="textarea">Texto largo</SelectItem>
                            <SelectItem value="select">Selector</SelectItem>
                            <SelectItem value="file">Archivo</SelectItem>
                            <SelectItem value="boolean">Sí/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Label */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Etiqueta *</Label>
                        <Input
                          placeholder="Ej: Texto a grabar"
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                        />
                      </div>

                      {/* Placeholder */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Placeholder</Label>
                        <Input
                          placeholder="Texto de ayuda"
                          value={field.placeholder}
                          onChange={(e) => updateCustomField(field.id, 'placeholder', e.target.value)}
                        />
                      </div>

                      {/* Coste extra */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Coste Extra (€)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={field.extraCost || ''}
                          onChange={(e) => updateCustomField(field.id, 'extraCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Checkbox obligatorio */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`required-${field.id}`} className="text-sm cursor-pointer">
                        Campo obligatorio
                      </Label>
                    </div>

                    {/* Opciones para select */}
                    {field.type === 'select' && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-600">Opciones del selector</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addSelectOption(field.id)}
                          >
                            <PlusCircle className="mr-1 h-3 w-3" />
                            Añadir opción
                          </Button>
                        </div>

                        {field.options && field.options.length > 0 ? (
                          <div className="space-y-2">
                            {field.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder={`Opción ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updateSelectOption(field.id, optIndex, e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSelectOption(field.id, optIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            No hay opciones. Añade al menos una opción.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Sin campos de personalización
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Añade campos para que los clientes puedan personalizar este producto
          </p>
          <Button
            type="button"
            onClick={addField}
            variant="outline"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir primer campo
          </Button>
        </div>
      )}

      {/* Preview de cómo se verá en ProductCustomizer */}
      {formData.custom_fields && formData.custom_fields.length > 0 && (
        <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>👁️</span> Vista previa del formulario
          </h4>
          <div className="space-y-3 bg-white p-4 rounded border border-blue-100">
            {formData.custom_fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs font-medium">
                  {field.label || 'Campo sin nombre'}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.extraCost > 0 && (
                    <span className="ml-2 text-green-600 text-xs">
                      (+{field.extraCost}€)
                    </span>
                  )}
                </Label>

                {field.type === 'text' && (
                  <Input placeholder={field.placeholder || 'Escribe aquí...'} disabled />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    rows={3}
                    placeholder={field.placeholder || 'Escribe aquí...'}
                    disabled
                  />
                )}

                {field.type === 'select' && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </Select>
                )}

                {field.type === 'file' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-xs text-gray-500">
                    Subir archivo
                  </div>
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled className="h-4 w-4" />
                    <span className="text-sm text-gray-600">Sí</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizationTab;
