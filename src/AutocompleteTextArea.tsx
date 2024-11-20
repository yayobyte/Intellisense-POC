import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import AutocompleteInput from "react-autocomplete-input";
import "react-autocomplete-input/dist/bundle.css";
import "./AutocompleteTextArea.css";

const DEFAULT_TRIGGER = '{{context.';
const listOfTriggers = [DEFAULT_TRIGGER];

// Example props data
const externalOptions = [
  {
    type: 'entity',
    value: 'customer',
    options: [
      { type: 'entity', value: 'name' },
      { type: 'entity', value: 'age' },
      { type: 'entity', value: 'phone' },
      {
        type: 'function',
        value: 'getAddress',
        options: [
          { type: 'query', value: 'zip' },
        ]
      }
    ]
  },
  {
    type: 'entity',
    value: 'location',
    options: [
      { type: 'entity', value: 'lat' },
      { type: 'entity', value: 'lon' },
      { type: 'function', value: 'getFormattedLocation' },
    ]
  }
];

// Recursive function to generate the list of triggers
const generateTriggers = (options, parent = '') => {
  let triggers = [];

  options.forEach(option => {
    const currentTrigger = `${parent}${option.value}.`;

    triggers.push(`${DEFAULT_TRIGGER}${currentTrigger}`);

    if (option.options && option.options.length > 0) {
      triggers = triggers.concat(generateTriggers(option.options, currentTrigger));
    }
  });

  return triggers;
};

const AutocompleteTextArea = () => {
  const { options } = { options: externalOptions} //Use Props
  const [value, setValue] = useState("");
  const [listOfTriggers, setListOfTriggers] = useState<string[]>([]);
  const [currentTrigger, setCurrentTrigger] = useState(DEFAULT_TRIGGER);  // Tracks the current context trigger
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]); // Tracks suggestions based on current trigger
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const formattedRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (trigger: string, suggestion: string) => {
    const input = `${trigger}${suggestion}.`
    const beforeCursor = value.substring(0, cursorIndex);
    const afterCursor = value.substring(cursorIndex);

    // Check if the suggestion belong to any of the triggers
    const shouldAddClosing = !listOfTriggers.includes(input)

    const newValue = `${beforeCursor}${trigger}${suggestion}}}${afterCursor.trimEnd()}`;
    setValue(newValue);
    setCursorIndex(beforeCursor.length + trigger.length + suggestion.length + 2);
    return `${trigger}${suggestion}${shouldAddClosing ? '}}' : ''}`;
  };

  const handleChange = (val: string) => {
    setValue(val);
    setCursorIndex(val.length);
  };

  const formatText = useCallback((text: string) => {
    const escapedTriggers = listOfTriggers.map(t => t.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'));
  
    const regexPattern = `(${escapedTriggers.join('|')})[\\w.-]+}}`; // Match trigger followed by key and closing }}
    const regex = new RegExp(regexPattern, 'g');
    return text.replace(regex, (match) => `<strong>${match}</strong>`);
  }, [listOfTriggers]);


  const handleFormattedTextClick = () => {
    setIsFocused(true);
    const textarea = document.querySelector<HTMLTextAreaElement>(".autocomplete-input"); //External Refs can not be used
    if (textarea) {
      textarea.focus();
      const valueLength = textarea.value.length;
      textarea.setSelectionRange(valueLength, valueLength);
    }
  };

useEffect(() => {
    const triggers = generateTriggers(options);
    setListOfTriggers([DEFAULT_TRIGGER, ...triggers]);
}, [options]);

  useEffect(() => {
  // Find the current suggestion options based on the current trigger
  const findOptionForTrigger = (trigger: string, options: any[]) => {
    for (let option of options) {
      if (`${DEFAULT_TRIGGER}${option.value}.` === trigger) {
        return option;
      }
      if (option.options) {
        const found = findOptionForTrigger(trigger, option.options);
        if (found) return found;
      }
    }
    return null;
  };

  const currentOption = findOptionForTrigger(currentTrigger, options);
  if (currentOption) {
    setCurrentSuggestions(currentOption.options ? currentOption.options.map(option => option.value) : []);
  }
  }, [currentTrigger, options]);

 console.log(listOfTriggers)
 console.log(currentSuggestions)

  return (
    <div className="autocomplete-container">
      <AutocompleteInput
        spacer=""
        matchAny={true}
        trigger={listOfTriggers}
        options={currentSuggestions}  // Dynamically updated suggestions
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
