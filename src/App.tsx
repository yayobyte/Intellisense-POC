import React from "react";
import InputComponent from "./InputComponent";
import { ConversationProvider } from "./ConversationContext";
import AutocompleteTextarea from "./AutocompleteTextArea";
import { ReactSearchAutocomplete } from "react-search-autocomplete";

const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    // ... more options
];

const App = () => {
  return (
    <ConversationProvider>
      <AutocompleteTextarea placeholder="Type here..." options={options}  />
    </ConversationProvider>
  );
};

export default App;
