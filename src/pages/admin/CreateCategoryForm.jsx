import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export default function CreateCategoryForm({ onSuccess }) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({ title: 'Nombre vacío', description: 'Introduce un nombre para la categoría.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ categoria: categoryName.trim() }])
      .select('id, categoria');
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Categoría creada', description: `"${data[0].categoria}" añadida.` });
    setCategoryName('');
    onSuccess?.(data[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="categoryName">Nombre de la categoría</Label>
        <Input
          id="categoryName"
          value={categoryName}
          onChange={e => setCategoryName(e.target.value)}
          placeholder="Ej: temporada, natalicio"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSuccess(null)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
        </Button>
      </div>
    </form>
  );
}
