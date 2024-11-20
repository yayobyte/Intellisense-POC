import { TOption } from "./AutocompleteTextArea.types";

export const DEFAULT_TRIGGER = '{{context.';

// Recursive function to generate the list of triggers
export const generateTriggers = (options: TOption[], parent = '') => {
    let triggers: string[] = [];
  
    options.forEach(option => {
      const currentTrigger = `${parent}${option.value}.`;
  
      // Only add triggers with sub-options
      if (option.options && option.options.length > 0) {
        triggers.push(`${DEFAULT_TRIGGER}${currentTrigger}`);
      }
      
      if (option.options && option.options.length > 0) {
        triggers = triggers.concat(generateTriggers(option.options, currentTrigger));
      }
    });
  
    return triggers;
  };
  
export const findOptionForTrigger = (trigger: string, options: TOption[], parent = ''):TOption | null => {
    for (const option of options) {
      // Dynamically construct the current trigger based on the parent
      const currentTrigger = `${parent}${option.value}.`;
  
      // Check if this is the target trigger
      if (trigger === `${DEFAULT_TRIGGER}${currentTrigger}`) {
        return option; // Exact match found
      }
  
      // Recurse deeper into options if there are sub-options
      if (option.options && trigger.startsWith(`${DEFAULT_TRIGGER}${currentTrigger}`)) {
        const found = findOptionForTrigger(trigger, option.options, currentTrigger);
        if (found) return found;
      }
    }
  
    return null; 
  };