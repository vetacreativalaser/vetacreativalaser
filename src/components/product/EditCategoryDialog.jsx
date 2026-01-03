import React from 'react';
import CategoryDialog from './CategoryDialog';

/**
 * Componente legacy para editar categorías
 * Ahora es un wrapper del componente unificado CategoryDialog
 */
const EditCategoryDialog = ({ isOpen, setIsOpen, category, onSuccess }) => {
  return (
    <CategoryDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      category={category}
      onSuccess={onSuccess}
    />
  );
};

export default EditCategoryDialog;
