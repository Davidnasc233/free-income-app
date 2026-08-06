export interface Category {
  id: string;
  label: string;
}

export const TRANSACTION_CATEGORIES: Category[] = [
  { id: 'outro', label: 'Outro' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'moradia', label: 'Moradia' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'saude', label: 'Saúde' },
];

export function getCategoryLabel(categoryId: string): string {
  return (
    TRANSACTION_CATEGORIES.find((c) => c.id === categoryId)?.label ??
    'Sem categoria'
  );
}
