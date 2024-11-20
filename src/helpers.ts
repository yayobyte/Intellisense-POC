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

export const findOptionRecursive = (value: string, options: TOption[]): TOption | null => {
    for (const option of options) {
      if (option.value === value) {
        return option;
      }
      if (option.options) {
        const found = findOptionRecursive(value, option.options);
        if (found) return found;
      }
    }
    return null;
  };

  export function createFlexContainer(): HTMLDivElement {
    const flexContainer = document.createElement("div");
    flexContainer.className = "suggestion-content";
    flexContainer.style.display = "flex";
    flexContainer.style.justifyContent = "space-between";
    flexContainer.style.alignItems = "center";
    flexContainer.style.width = "100%";
    return flexContainer;
  }
  
  export function createSuggestionSpan(text: string): HTMLSpanElement {
    const suggestionSpan = document.createElement("span");
    suggestionSpan.textContent = text;
    return suggestionSpan;
  }
  
  export function createCustomSpan(type: string): HTMLSpanElement {
    const customSpan = document.createElement("span");
    customSpan.textContent = type;
    customSpan.style.marginLeft = "10px";
    customSpan.style.color = "#888";
    customSpan.style.fontWeight = "400";
    return customSpan;
  }
  