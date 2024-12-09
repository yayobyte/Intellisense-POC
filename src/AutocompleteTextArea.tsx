import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
} from "react";
import AutocompleteInput from "./AutocompleteTextAreaCore";
import { TSuggestion } from "./AutocompleteTextArea.types";
import { createCustomSpan, createFlexContainer, createSuggestionSpan, findTriggerInOptions } from "./helpers";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const ForwardedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props  }, ref) => {
    return <textarea
      {...props}
      ref={ref}
      rows={4}
      className={`${className} focus:outline-none rounded-sm focus:border-gray-400 h-full`} />;
  }
);

type AutocompleteTextAreaProps = {
  initialValue?: string;
  options: TSuggestion[];
  onChange: (value: string) => void;
  defaultTrigger: string;
  id?: string;
};

const AutocompleteTextArea = ({
  options,
  onChange,
  defaultTrigger,
  initialValue = "",
  id = "",
}: AutocompleteTextAreaProps) => {
  const [value, setValue] = useState(initialValue);
  const [listOfTriggers, setListOfTriggers] = useState<string[]>([defaultTrigger]);
  const [currentSuggestionList, setCurrentSuggestionsList] = useState<string[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<TSuggestion | undefined>();
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formattedRef = useRef<HTMLDivElement | null>(null);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);

  const resetSuggestions = useCallback(() => {
    setCurrentSuggestionsList(options.map((option) => option.value));
    setCurrentSuggestion(undefined);
    setListOfTriggers([defaultTrigger]);
  }, [options]);

  const getCursorIndex = () => {
    if (textareaRef.current) {
      return textareaRef.current.selectionStart || 0;
    }
    return 0;
  };

  const onChangeValue = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  const handleSelect = (trigger: string, suggestion: string) => {
    let suggestedValue = suggestion;
    const cursorIndex = getCursorIndex()
    const { option } = findTriggerInOptions(value, cursorIndex, options, defaultTrigger);
    //if type is function, add parenthesis and close the subsequent suggestions
    if (option?.options){
      const suggestionOption = option.options.find((opt) => opt.value === suggestion);
      if (suggestionOption?.type === 'function') {
        suggestedValue = `${suggestion}()}}`;
      }
    }
    return `${trigger}${suggestedValue}`;
  };

  const formatText = useCallback((text: string) => {
    const regex = /\{\{(.*?)\}\}/g;
    return text.replace(regex, (match) => `<strong>${match}</strong>`);
  }, []);

  const handleFormattedTextClick = () => {
    setIsFocused(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const valueLength = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(valueLength, valueLength);
    }
  };

  useEffect(() => {
    const cursorIndex = getCursorIndex();
    const triggerContext = findTriggerInOptions(value, cursorIndex, options, defaultTrigger);

    if (triggerContext) {
      const { trigger, option } = triggerContext;
      const activeOption = option;
      if (activeOption && activeOption.options?.length) {
        setCurrentSuggestion(activeOption);
        setCurrentSuggestionsList(activeOption.options.map((opt) => opt.value));
        setListOfTriggers([trigger]);
      } else {
        resetSuggestions();
      }
    } else {
      resetSuggestions();
    }
  }, [value, options, defaultTrigger ])

  //Append type of suggestion to the library
  useEffect(() => {
    const suggestionList = suggestionsRef;
    const enhanceSuggestions = () => {
      if (suggestionList?.current) {
        const items = suggestionList.current.querySelectorAll("li");
        items.forEach((item) => {
          const suggestionText = item.textContent?.trim();
          const activeOptions = currentSuggestion?.options || options;
          const option = activeOptions.find((opt) => opt.value === suggestionText);

          if (option) {
            const flexContainer = createFlexContainer();
            const suggestionSpan = createSuggestionSpan(item.textContent?.trim() || "");
            const customSpan = createCustomSpan(option.type);

            flexContainer.appendChild(suggestionSpan);
            flexContainer.appendChild(customSpan);

            item.textContent = "";
            item.appendChild(flexContainer);
          }
        });
      }
    };

    const timeoutId = setTimeout(enhanceSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [options, value, currentSuggestionList, currentSuggestion]);

  // Effect to synchronize scroll positions in textarea and formattedText div
  useEffect(() => {
  const textarea = textareaRef.current;
  const formattedDiv = formattedRef.current;

  if (textarea && formattedDiv) {
    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      target.scrollTop = source.scrollTop;
    };

    const handleTextareaScroll = () => syncScroll(textarea, formattedDiv);
    const handleDivScroll = () => syncScroll(formattedDiv, textarea);

    textarea.addEventListener("scroll", handleTextareaScroll);
    formattedDiv.addEventListener("scroll", handleDivScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      formattedDiv.removeEventListener("scroll", handleDivScroll);
    };
  }
}, [textareaRef, formattedRef]);

  return (
    <div className="relative w-full flex flex-col overflow-hidden min-h-28 flex-1" id={id}>
      <AutocompleteInput
        spacer=""
        defaultValue={initialValue}
        Component={ForwardedTextarea}
        matchAny={true}
        trigger={listOfTriggers}
        options={currentSuggestionList}
        value={value}
        onChange={onChangeValue}
        changeOnSelect={handleSelect}
        className={`absolute top-0 left-0 w-full z-20 p-2 bg-transparent h-full border border-gray-300 text-sm leading-6 ${
          isFocused ? "" : "opacity-0 pointer-events-none"
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        ref={textareaRef}
        suggestionsRef={suggestionsRef}
        maxOptions={50}
        offsetY={-20}
      />
      <div
        className={`absolute top-0 left-0 w-full p-2 whitespace-pre-wrap break-words h-full overflow-y-auto text-sm leading-6 bg-white border border-gray-300 rounded-sm ${
          isFocused ? "invisible" : "visible"
        }`}
        ref={formattedRef}
        onMouseDown={(e) => {
          e.preventDefault();
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        onClick={handleFormattedTextClick}
      >
        <span dangerouslySetInnerHTML={{ __html: formatText(value) }} />
      </div>
    </div>
);

};

export default AutocompleteTextArea;
