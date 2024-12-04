import { TSuggestion } from "./AutocompleteTextArea.types";

// Recursive function to generate the list of triggers
export const generateTriggers = (options: TSuggestion[], defaultTrigger: string, parent = '', ) => {
    let triggers: string[] = [];

    options?.forEach(option => {
      const currentTrigger = `${parent}${option.value}.`;

      // Only add triggers with sub-options
      if (option.options && option.options.length > 0) {
        triggers.push(`${defaultTrigger}${currentTrigger}`);
      }

      if (option.options && option.options.length > 0) {
        triggers = triggers.concat(generateTriggers(option.options, defaultTrigger, currentTrigger));
      }
    });

    return triggers;
  };

  export const findOptionForTrigger = (
    trigger: string,
    options: TSuggestion[],
    defaultTrigger: string
  ): TSuggestion | null => {
    for (const option of options) {
      if (`${defaultTrigger}${option.trigger}` === trigger) {
        return option;
      }
      // Recurse deeper if the option has sub-options
      if (option.options) {
        const found = findOptionForTrigger(trigger, option.options, defaultTrigger);
        if (found) return found;
      }
    }
    return null;
  };
  

export const findOptionRecursive = (value: string, options: TSuggestion[]): TSuggestion | null => {
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

  export const findActiveTriggerContext = (text: string, cursorIndex: number, listOfTriggers: string[]) => {
    // Find the last trigger before the cursor
    for (let i = cursorIndex; i >= 0; i--) {
      const slice = text.slice(i, cursorIndex);
      if (slice.length > 0 && listOfTriggers.includes(slice)) {
        return { trigger: slice, startIndex: i };
      }
    }
    return null;
  };