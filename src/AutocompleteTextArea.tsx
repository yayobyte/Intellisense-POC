import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
} from "react";
import AutocompleteInput from "./AutocompleteTextAreaCore";
import { TSuggestion } from "./AutocompleteTextArea.types";
import { createCustomSpan, createFlexContainer, createSuggestionSpan, findOptionForTrigger as findSuggestionForTrigger, generateTriggers, findActiveTriggerContext } from "./helpers";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const ForwardedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props  }, ref) => {
    return <textarea
      {...props}
      ref={ref}
      rows={4}
      className={`${className} focus:outline-none focus:ring-8 focus:ring-gray-400 focus:border-gray-400 rounded-md focus:rounded-md h-full`} />;
  }
);

type AutocompleteTextAreaProps = {
  initialValue?: string;
  options: TSuggestion[];
  onChange: (value: string) => void;
  defaultTrigger?: string;
  id?: string;
};

const DEFAULT_TRIGGER = '{{context.';

const AutocompleteTextArea = ({
  options,
  onChange,
  defaultTrigger = DEFAULT_TRIGGER,
  initialValue = "",
  id = "",
}: AutocompleteTextAreaProps) => {
  const [value, setValue] = useState(initialValue);
  const [listOfTriggers, setListOfTriggers] = useState<string[]>([defaultTrigger]);
  const [currentSuggestionList, setCurrentSuggestionsList] = useState<string[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<TSuggestion | undefined>();
  const [isFocused, setIsFocused] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<string | undefined>()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formattedRef = useRef<HTMLDivElement | null>(null);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);

  const resetSuggestions = useCallback(() => {
    setCurrentSuggestionsList(options.map((option) => option.value));
    setCurrentSuggestion(undefined);
  }, [options]);

  const getCursorIndex = () => {
    if (textareaRef.current) {
      return textareaRef.current.selectionStart || 0;
    }
    return 0;
  };

  const onChangeValue = (newValue: string) => {
    setValue(newValue)
    onChange(newValue)
  };

  const handleSelect = (trigger: string, suggestion: string) => {
    if (textareaRef.current) {
      const value = textareaRef.current.value;
      const cursorIndex = getCursorIndex();
      const triggerContext = findActiveTriggerContext(value, cursorIndex, listOfTriggers);

      if (triggerContext) {
        const { startIndex } = triggerContext;
        const triggerLength = triggerContext.trigger.length;

        const part1 = value.substring(0, startIndex); // Before the trigger
        const part2 = value.substring(startIndex + triggerLength); // After the trigger

        const newTrigger = `${trigger}${suggestion}.`;
        const newValue = `${part1}${newTrigger}${part2}`.trimEnd();

        onChangeValue(newValue);

        const activeOption = findSuggestionForTrigger(newTrigger, options, defaultTrigger);
        if (activeOption && activeOption.options?.length) {
          setCurrentSuggestion(activeOption);
          setCurrentSuggestionsList(activeOption.options.map((opt) => opt.value));
        } else {
          resetSuggestions();
        }
        return `${trigger}${suggestion}`;
      }
    }
    return `${trigger}${suggestion}`;
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
    const activeOption = findSuggestionForTrigger(currentTrigger, options, defaultTrigger);
    if (activeOption) {
      setCurrentSuggestion(activeOption);
      setCurrentSuggestionsList(
        activeOption.options?.map((option) => option.value) || []
      );
    } else {
      resetSuggestions();
    }
  }, [currentTrigger, options, defaultTrigger, resetSuggestions]);

  useEffect(() => {
    const triggers = generateTriggers(options, defaultTrigger);
    setListOfTriggers([defaultTrigger, ...triggers]);
    resetSuggestions();
  }, [options, resetSuggestions, defaultTrigger]);

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
        className={`absolute top-0 left-0 w-full z-20 p-2 bg-transparent h-full border border-gray-300 rounded-sm text-sm leading-6 ${
          isFocused ? "" : "opacity-0 pointer-events-none"
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onHandleCurrentTrigger={(trigger: string) => setCurrentTrigger(trigger)}
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
