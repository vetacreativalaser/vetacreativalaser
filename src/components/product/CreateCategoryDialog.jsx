import React from 'react';
import CategoryDialog from './CategoryDialog';

/**
 * Componente legacy para crear categorías
 * Ahora es un wrapper del componente unificado CategoryDialog
 */
const CreateCategoryDialog = ({ isOpen, setIsOpen, onSuccess }) => {
  return (
    <CategoryDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      category={null}
      onSuccess={onSuccess}
    />
  );
};

export default CreateCategoryDialog;
