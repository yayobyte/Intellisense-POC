import { faker } from '@faker-js/faker';
import { TSuggestion } from './AutocompleteTextArea.types';


export const generateMockSuggestions = (): TSuggestion[] => {
  const categories = ['customer', 'bill', 'invoice', 'order', 'client', 'vendor', 'company', 'sale', 'representative'];

  const createNestedSuggestions = (prefix: string, depth: number): TSuggestion[] => {
    if (depth === 0) return [];

    return Array.from({ length: 3 }, () => {
      const value = faker.helpers.arrayElement([
        'name',
        'number',
        'address',
        'amount',
        'date',
        'status',
        'price',
        'discount',
        'color',
        'size'
      ]);
      const isObject = value === 'address'; // Treat "address" as a nested object.

      return {
        value,
        trigger: `${prefix}${value}.`,
        type: isObject ? 'object' : 'string',
        options: isObject ? createNestedSuggestions(`${prefix}${value}.`, depth - 1) : undefined,
      };
    });
  };

  return categories.map((category) => ({
    value: category,
    trigger: `{{context.${category}.`,
    type: 'object',
    options: createNestedSuggestions(`{{context.${category}.`, 2),
  }));
};

// Example usage
export const mockSuggestions: TSuggestion[] = generateMockSuggestions();
