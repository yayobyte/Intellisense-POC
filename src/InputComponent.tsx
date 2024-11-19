import React, {
  useContext,
  useState,
  useRef,
  useEffect,
  FormEvent,
  ChangeEvent,
} from "react";
import Autosuggest from "react-autosuggest";
import ConversationContext from "./ConversationContext";
import "./InputComponent.css";

const InputComponent = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { customer } = useContext(ConversationContext);
  const [isTypingDoubleCurly, setIsTypingDoubleCurly] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const previousSuggestions = useRef<string[]>([]);

  const getCursorPosition = () => {
    if (textareaRef.current) {
      const selectionStart = textareaRef.current.selectionStart;
      const selectionEnd = textareaRef.current.selectionEnd;
      const textareaValue = textareaRef.current.value;

      let lineNumber = 0;
      let charOffset = 0;
      let currentPosition = 0;
      for (let i = 0; i < selectionStart; i++) {
        if (textareaValue[i] === "\n") {
          lineNumber++;
          charOffset = 0;
        } else {
          charOffset++;
        }
        currentPosition = i;
      }

      const lineHeight = 16;
      const x = charOffset * 8;
      const y = lineNumber * lineHeight;
      return { x, y };
    }
    return null;
  };

  const updateSuggestionsPosition = () => {
    const cursorPosition = getCursorPosition();
    if (cursorPosition && suggestionsRef.current) {
      const textareaRect = textareaRef.current.getBoundingClientRect();
      suggestionsRef.current.style.top = `${cursorPosition.y}`;
      suggestionsRef.current.style.left = `${cursorPosition.x + textareaRect.left}px`;
    }
  };

  const getSuggestions = (value: string) => {
    console.log("getSuggestions called with value:", value);
    if (value.endsWith("{{context.") && value.length > 3) {
      const newSuggestions: string[] = [];
      for (const key in customer) {
        if (customer.hasOwnProperty(key)) {
          newSuggestions.push(`{{${key}}}`);
        }
      }
      setSuggestions(newSuggestions);
      console.log("Generated suggestions:", newSuggestions);
      previousSuggestions.current = newSuggestions;
    } else {
      setSuggestions([]);
    }
  };

  const onSuggestionSelected = (
    event: React.SyntheticEvent,
    { suggestion }: { suggestion: string },
  ) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;

    const cleanSuggestion = suggestion.replace(/{{|}}/g, "");

    const openingBraceIndex = value.lastIndexOf("{{", cursorPosition);

    setValue(
      value.substring(0, openingBraceIndex + 2) +
        `context.${cleanSuggestion}` + // Prepend "context."
        "}}" + // Add the closing curly braces
        value.substring(cursorPosition),
    );

    inputRef.current?.setSelectionRange(
      openingBraceIndex + 2 + `context.${cleanSuggestion}`.length + 2,
      openingBraceIndex + 2 + `context.${cleanSuggestion}`.length + 2,
    );

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const onSuggestionsClearRequested = () => {
    if (value !== previousSuggestions.current.join(",")) {
      setSuggestions([]);
    }
  };

  const handleInputChange = (
    event: FormEvent<HTMLElement>,
    { newValue }: ChangeEvent<Element>,
  ) => {
    setValue(newValue);
    setIsTypingDoubleCurly(newValue.endsWith("{{") && newValue.length > 2);
  };

  const renderSuggestion = (suggestion: string) => {
    console.log(suggestion);
    return <span>{"context." + suggestion.replace(/{{|}}/g, "")}</span>;
  };

  const inputProps = {
    placeholder: "React-Autosuggest: Enter message...",
    value,
    onChange: handleInputChange,
  };

  useEffect(() => {
    updateSuggestionsPosition();
  }, [value]);

  return (
    <div className="input-container">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={() => {
          getSuggestions(value);
        }}
        onSuggestionSelected={onSuggestionSelected}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        inputProps={inputProps}
        getSuggestionValue={(suggestion) => suggestion}
        renderSuggestion={renderSuggestion}
        renderInputComponent={(inputProps) => (
          <textarea key="my-textarea-key" {...inputProps} ref={inputRef} />
        )}
      />
      <div ref={suggestionsRef} className="suggestions-container"></div>
    </div>
  );
};

export default InputComponent;
