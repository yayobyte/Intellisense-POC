import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import AutocompleteInput from "react-autocomplete-input";
import "react-autocomplete-input/dist/bundle.css";
import "./AutocompleteTextArea.css";
import { TOption } from "./AutocompleteTextArea.types";
import { createCustomSpan, createFlexContainer, createSuggestionSpan, DEFAULT_TRIGGER, findOptionForTrigger, generateTriggers } from "./helpers";

type AutocompleteTextAreaProps = {
  options: TOption[];
  onChange: (value: string) => void
  defaultTrigger?: string
};

const AutocompleteTextArea = ({ options, onChange, defaultTrigger = DEFAULT_TRIGGER }: AutocompleteTextAreaProps) => {
  const [value, setValue] = useState("");
  const [listOfTriggers, setListOfTriggers] = useState<string[]>([defaultTrigger]);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]); // Tracks suggestions based on current trigger
  const [currentOption, setCurrentOption] = useState<TOption>()
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const formattedRef = useRef<HTMLDivElement | null>(null);

  // Reset suggestions to top level if at root context ({{context.})
  const resetSuggestions = useCallback(() => {
    setCurrentSuggestions(options.map(option => option.value));
  }, [options])

  const onChangeValue = (value: string) => {
    setValue(value)
    onChange(value)
  }

  // Handle selection of trigger and suggestion
  const handleSelect = (trigger: string, suggestion: string) => {
    const input = `${trigger}${suggestion}.`;
    const beforeCursor = value.substring(0, cursorIndex);
    const afterCursor = value.substring(cursorIndex);
  
    const shouldAddClosing = !listOfTriggers.includes(input);
  
    const newValue = `${beforeCursor}${trigger}${suggestion}}}${afterCursor.trimEnd()}`;
    onChangeValue(newValue);
    setCursorIndex(beforeCursor.length + trigger.length + suggestion.length + 2);
  
    const newTrigger = `${trigger}${suggestion}.`;
  
    // Check if the trigger reached the top-level and reset suggestions
    if (newTrigger === defaultTrigger) {
      resetSuggestions();
    } else {
      // Find the option corresponding to the selected trigger
      const currentOption = findOptionForTrigger(newTrigger, options);
      
      if (currentOption) {
        setCurrentOption(currentOption)
        // If the selected option has sub-options, update the suggestions list
        if (currentOption.options && currentOption.options.length > 0) {
          setCurrentSuggestions(currentOption.options.map(option => option.value));
        } else {
          resetSuggestions()
        }
      }
    }

    return `${trigger}${suggestion}${shouldAddClosing ? '}}' : ''}`;
  };
  
  const handleChange = (val: string) => {
    onChangeValue(val);
    setCursorIndex(val.length);
  };

  // Format the text for display (highlight triggers)
  const formatText = useCallback((text: string) => {
    const escapedTriggers = listOfTriggers.map(t => t.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'));
  
    const regexPattern = `(${escapedTriggers.join('|')})[\\w.-]+}}`; // Match trigger followed by key and closing }}
    const regex = new RegExp(regexPattern, 'g');
    return text.replace(regex, (match) => `<strong>${match}</strong>`);
  }, [listOfTriggers]);

  // Handle click event on formatted text
  const handleFormattedTextClick = () => {
    setIsFocused(true);
    const textarea = document.querySelector<HTMLTextAreaElement>(".autocomplete-input");
    if (textarea) {
      textarea.focus();
      const valueLength = textarea.value.length;
      textarea.setSelectionRange(valueLength, valueLength);
    }
  };

  // Update list of triggers and suggestions based on selected context
  useEffect(() => {
    const triggers = generateTriggers(options);
    setListOfTriggers([defaultTrigger, ...triggers]);
    resetSuggestions(); // Reset to top-level suggestions on mount
  }, [options, resetSuggestions, defaultTrigger]);

  useEffect(() => {
    const enhanceSuggestions = () => {
      const suggestionList = document.querySelector(".react-autocomplete-input");

      if (suggestionList) {
        const items = suggestionList.querySelectorAll("li");
        items.forEach((item) => {
          const suggestionText = item.textContent?.trim();
          const activeOptions = currentOption?.options || options;
          const option = activeOptions.find(opt => opt.value === suggestionText)

          if (option) {
            const flexContainer = createFlexContainer()
            const suggestionSpan = createSuggestionSpan(item.textContent?.trim() || "")
            const customSpan = createCustomSpan(option.type);

            // Append both spans to the flex container
            flexContainer.appendChild(suggestionSpan);
            flexContainer.appendChild(customSpan);

            // Clear item content and replace it with flex container
            item.textContent = "";
            item.appendChild(flexContainer);
          }
        });
      }
    };

    enhanceSuggestions();

    // // Re-run when suggestions change
    // const observer = new MutationObserver(enhanceSuggestions);
    // const target = document.querySelector(".react-autocomplete-input");
    // if (target) {
    //   observer.observe(target, { childList: true });
    // }

    // return () => {
    //   observer.disconnect();
    // };
  }, [options, value, currentSuggestions]);

  return (
    <div className="autocomplete-container">
      <AutocompleteInput
        spacer=""
        matchAny={true}
        trigger={listOfTriggers}
        options={currentSuggestions}
        value={value}
        onChange={handleChange}
        changeOnSelect={handleSelect}
        className={`autocomplete-input plain-textarea ${
          isFocused ? "" : "hidden"
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div
        className={`formatted-text ${isFocused ? "" : "visible"}`}
        ref={formattedRef}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleFormattedTextClick}
      >
        <span
          dangerouslySetInnerHTML={{ __html: formatText(value) }}
        />
      </div>
    </div>
  );
};

export default AutocompleteTextArea;
