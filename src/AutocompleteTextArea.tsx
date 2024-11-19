import React, {
  useState,
  useRef,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import AutocompleteInput from "react-autocomplete-input";
import ConversationContext from "./ConversationContext";
import "react-autocomplete-input/dist/bundle.css";
import "./AutocompleteTextArea.css";

const DEFAULT_TRIGGER = '{{context.'
const trigger = [DEFAULT_TRIGGER]

const TextAreaInput = (props: TextareaProps) => {
    return (
        <textarea {...props}/>
    )
}

const AutocompleteTextArea = () => {
  const { customer } = useContext(ConversationContext);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formattedRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  
  const handleSelect = (trigger: string, suggestion: string) => {
    const beforeCursor = value.substring(0, cursorIndex);
    const afterCursor = value.substring(cursorIndex);
    const newValue = `${beforeCursor}${trigger}${suggestion}}}${afterCursor}`;
    setValue(newValue);
    setCursorIndex(beforeCursor.length + trigger.length + suggestion.length + 2);
    return `${trigger}${suggestion}}}`;
  };

  const handleChange = (val: string) => {
    setValue(val);
    setCursorIndex(val.length); // Assumes cursor is always at the end; adjust for custom behavior.
  };

  const updateCursor = useCallback(() => {
    if (cursorRef.current && formattedRef.current) {
      const textBeforeCursor = value.slice(0, cursorIndex);
      const span = document.createElement("span");
      span.textContent = textBeforeCursor;

      const range = document.createRange();
      const dummySpan = document.createElement("span");
      dummySpan.style.visibility = "hidden";
      dummySpan.textContent = textBeforeCursor;

      formattedRef.current.appendChild(dummySpan);
      const { width, height } = dummySpan.getBoundingClientRect();
      cursorRef.current.style.left = `${width}px`;
      cursorRef.current.style.top = `${height}px`;
      formattedRef.current.removeChild(dummySpan);
    }
  }, [cursorIndex, value]);

  const formatText = useCallback((text: string) => {
    return text.replace(
      /{{context\.\w+}}/g,
      (match) => `<strong>${match}</strong>`
    );
  }, []);

  useEffect(() => {
    const newSuggestions = Object.keys(customer).map((key) => key);
    setSuggestions(newSuggestions);
  }, [customer])

  useEffect(() => {
    updateCursor();
  }, [value, cursorIndex, updateCursor]);

  return (
    <div className="autocomplete-container">
      <div
        className="formatted-text"
        ref={formattedRef}
        onClick={() => textareaRef.current?.focus()}
      >
        <span
          dangerouslySetInnerHTML={{ __html: formatText(value) }}
        />
        <span ref={cursorRef} className="cursor">&#8203;</span>
      </div>
      <AutocompleteInput
        matchAny={true}
        trigger={trigger}
        options={suggestions}
        value={value}
        onChange={handleChange}
        changeOnSelect={handleSelect}
        className="autocomplete-input plain-textarea"
      />
    </div>
  );
};

export default AutocompleteTextArea;
