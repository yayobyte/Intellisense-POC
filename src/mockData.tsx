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

export const mockedOptions = [
  {
      "value": "test 4",
      "type": "entity",
      "options": [],
      "trigger": "test 4."
  },
  {
      "value": "array data source",
      "type": "entity",
      "options": [],
      "trigger": "array data source."
  },
  {
      "value": "customer",
      "type": "entity",
      "options": [
          {
              "value": "name",
              "type": "string",
              "trigger": "customer.name."
          },
          {
              "value": "email",
              "type": "string",
              "trigger": "customer.email."
          },
          {
              "value": "key1",
              "type": "number",
              "trigger": "customer.key1."
          },
          {
              "value": "key2",
              "type": "string",
              "trigger": "customer.key2."
          },
          {
              "value": "key3",
              "type": "string",
              "trigger": "customer.key3."
          },
          {
              "value": "obj2",
              "type": "object",
              "options": [
                  {
                      "value": "obj-inner-key",
                      "type": "boolean",
                      "trigger": "customer.obj2.obj-inner-key."
                  }
              ],
              "trigger": "customer.obj2."
          },
          {
              "value": "key4",
              "type": "string",
              "trigger": "customer.key4."
          },
          {
              "value": "key5",
              "type": "string",
              "trigger": "customer.key5."
          },
          {
              "value": "key6",
              "type": "string",
              "trigger": "customer.key6."
          },
          {
              "value": "obj1",
              "type": "object",
              "options": [
                  {
                      "value": "obj-inner-key",
                      "type": "boolean",
                      "trigger": "customer.obj1.obj-inner-key."
                  }
              ],
              "trigger": "customer.obj1."
          }
      ],
      "trigger": "customer."
  },
  {
      "value": "test 1",
      "type": "entity",
      "options": [
          {
              "value": "name1",
              "type": "string",
              "trigger": "test 1.name1."
          },
          {
              "value": "email",
              "type": "string",
              "trigger": "test 1.email."
          },
          {
              "value": "address",
              "type": "object",
              "options": [
                  {
                      "value": "zip",
                      "type": "number",
                      "trigger": "test 1.address.zip."
                  },
                  {
                      "value": "street",
                      "type": "string",
                      "trigger": "test 1.address.street."
                  },
                  {
                      "value": "directions",
                      "type": "object",
                      "options": [
                          {
                              "value": "info1",
                              "type": "string",
                              "trigger": "test 1.address.directions.info1."
                          },
                          {
                              "value": "info2",
                              "type": "string",
                              "trigger": "test 1.address.directions.info2."
                          }
                      ],
                      "trigger": "test 1.address.directions."
                  }
              ],
              "trigger": "test 1.address."
          }
      ],
      "trigger": "test 1."
  },
  {
      "value": "test 6",
      "type": "entity",
      "options": [],
      "trigger": "test 6."
  },
  {
      "value": "Dog",
      "type": "entity",
      "options": [],
      "trigger": "Dog."
  },
  {
      "value": "primitive data source",
      "type": "entity",
      "options": [],
      "trigger": "primitive data source."
  },
  {
      "value": "test 3",
      "type": "entity",
      "options": [],
      "trigger": "test 3."
  },
  {
      "value": "test 2",
      "type": "entity",
      "options": [],
      "trigger": "test 2."
  },
  {
      "value": "bill",
      "type": "entity",
      "options": [
          {
              "value": "bill_name",
              "type": "string",
              "trigger": "bill.bill_name."
          },
          {
              "value": "invoice_date",
              "type": "string",
              "trigger": "bill.invoice_date."
          },
          {
              "value": "bill_id",
              "type": "number",
              "trigger": "bill.bill_id."
          }
      ],
      "trigger": "bill."
  }
]

// Example usage
export const mockSuggestions: TSuggestion[] = generateMockSuggestions();
