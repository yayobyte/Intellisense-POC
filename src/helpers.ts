import { TSuggestion } from "./AutocompleteTextArea.types";

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

export const findTriggerInOptions = (
  text: string,
  cursorIndex: number,
  options: TSuggestion[],
  defaultTrigger: string
) => {
  const part1 = text.slice(0, cursorIndex);
  const lastIndex = part1.lastIndexOf(defaultTrigger);
  const relevantPart = lastIndex !== -1 ? part1.slice(lastIndex + defaultTrigger.length) : part1;
  const parts = relevantPart
    .split(/[.(]/)
    .filter(part => part && part !== defaultTrigger.replace('{{', '').replace('}}', ''));

  let currentOptions = options;
  let trigger = defaultTrigger;
  let foundOption: TSuggestion | null = null;

  parts.forEach(part => {
    const option = currentOptions.find(opt => opt.value === part);
    if (option) {
      foundOption = option;
      trigger += `${option.value}.`;
      if (option.options) {
        currentOptions = option.options;
      }
    } else {
      foundOption = null;
    }
  });

return { trigger, startIndex: -1, option: foundOption };
};
