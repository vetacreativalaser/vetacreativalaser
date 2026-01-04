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
  Euro,
  Package
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

  // Helper: Asegurar que custom_fields sea siempre un array
  const getCustomFields = () => {
    if (!formData.custom_fields) {
      return [];
    }
    if (Array.isArray(formData.custom_fields)) {
      return formData.custom_fields;
    }
    // Si es un string, intentar parsearlo (fix para datos guardados como string en BD)
    if (typeof formData.custom_fields === 'string') {
      try {
        const parsed = JSON.parse(formData.custom_fields);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('❌ Error al parsear custom_fields:', e);
      }
    }
    // Cualquier otro caso: retornar array vacío
    console.error('❌ CustomizationTab: custom_fields tiene formato inválido');
    return [];
  };

  const customFields = getCustomFields();

  // Añadir nuevo campo
  const addField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      extraCost: 0,
      options: [], // Solo para select
      conditionalOn: null, // {fieldId: string, value: string} - Se muestra solo si otro campo tiene cierto valor
    };

    updateField('custom_fields', [...customFields, newField]);
    setExpandedField(newField.id);
  };

  // Actualizar campo específico
  const updateCustomField = (fieldId, property, value) => {
    const updatedFields = customFields.map(field =>
      field.id === fieldId
        ? { ...field, [property]: value }
        : field
    );

    updateField('custom_fields', updatedFields);
  };

  // Eliminar campo
  const removeField = (fieldId) => {
    updateField('custom_fields', customFields.filter(f => f.id !== fieldId));
    if (expandedField === fieldId) {
      setExpandedField(null);
    }
  };

  // Mover campo arriba
  const moveFieldUp = (index) => {
    if (index === 0) return;
    const fields = [...customFields];
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    updateField('custom_fields', fields);
  };

  // Mover campo abajo
  const moveFieldDown = (index) => {
    if (index === customFields.length - 1) return;
    const fields = [...customFields];
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    updateField('custom_fields', fields);
  };

  // Añadir opción a campo select
  const addSelectOption = (fieldId) => {
    const field = customFields.find(f => f.id === fieldId);
    if (!field) return;

    const newOption = {
      value: '',
      label: '',
      extraCost: 0,
      showFields: [] // IDs de campos que se mostrarán si se selecciona esta opción
    };
    const newOptions = [...(field.options || []), newOption];
    updateCustomField(fieldId, 'options', newOptions);
  };

  // Actualizar opción de select
  const updateSelectOption = (fieldId, optionIndex, property, value) => {
    const field = customFields.find(f => f.id === fieldId);
    if (!field) return;

    const newOptions = [...(field.options || [])].map((opt, i) => {
      // Convertir opciones antiguas (string) a nuevo formato (objeto)
      const option = typeof opt === 'string' ? { value: opt, label: opt, extraCost: 0, showFields: [] } : opt;

      if (i === optionIndex) {
        return { ...option, [property]: value };
      }
      return option;
    });
    updateCustomField(fieldId, 'options', newOptions);
  };

  // Eliminar opción de select
  const removeSelectOption = (fieldId, optionIndex) => {
    const field = customFields.find(f => f.id === fieldId);
    if (!field) return;

    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
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
      {customFields.length > 0 ? (
        <div className="space-y-3">
          {customFields.map((field, index) => {
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

                    {/* Configuración de campo condicional */}
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <Label className="text-xs text-gray-600">Mostrar campo condicionalmente</Label>
                      <div className="space-y-2">
                        <Select
                          value={field.conditionalOn?.fieldId || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              updateCustomField(field.id, 'conditionalOn', null);
                            } else {
                              updateCustomField(field.id, 'conditionalOn', { fieldId: value, value: '' });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Siempre visible" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Siempre visible</SelectItem>
                            {customFields
                              .filter(f => f.id !== field.id && f.type === 'select')
                              .map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  Solo si "{f.label || 'Sin nombre'}" es...
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {field.conditionalOn?.fieldId && (() => {
                          const parentField = customFields.find(f => f.id === field.conditionalOn.fieldId);
                          if (!parentField || !parentField.options) return null;

                          return (
                            <Select
                              value={field.conditionalOn.value || ''}
                              onValueChange={(value) => {
                                updateCustomField(field.id, 'conditionalOn', { ...field.conditionalOn, value });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un valor" />
                              </SelectTrigger>
                              <SelectContent>
                                {parentField.options.map((opt, idx) => {
                                  const option = typeof opt === 'string' ? { value: opt, label: opt } : opt;
                                  return (
                                    <SelectItem key={idx} value={option.value}>
                                      {option.label || option.value}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          );
                        })()}

                        {field.conditionalOn?.fieldId && field.conditionalOn?.value && (
                          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            Este campo solo se mostrará cuando "{customFields.find(f => f.id === field.conditionalOn.fieldId)?.label}" sea "{field.conditionalOn.value}"
                          </p>
                        )}
                      </div>
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
                          <div className="space-y-3">
                            {(field.options || []).map((opt, optIndex) => {
                              // Normalizar opción (soportar formato antiguo string y nuevo objeto)
                              const option = typeof opt === 'string' ? { value: opt, label: opt, extraCost: 0 } : opt;

                              return (
                                <div key={optIndex} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder={`Opción ${optIndex + 1}`}
                                      value={option.label || option.value || ''}
                                      onChange={(e) => {
                                        updateSelectOption(field.id, optIndex, 'label', e.target.value);
                                        updateSelectOption(field.id, optIndex, 'value', e.target.value);
                                      }}
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

                                  {/* Coste extra de la opción */}
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs text-gray-600 whitespace-nowrap">Coste extra:</Label>
                                    <div className="relative flex-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={option.extraCost || 0}
                                        onChange={(e) => updateSelectOption(field.id, optIndex, 'extraCost', parseFloat(e.target.value) || 0)}
                                        className="pr-8"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
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
            {customFields.map((field) => (
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
