import AutocompleteTextarea from "./AutocompleteTextArea";
import { TSuggestion } from "./AutocompleteTextArea.types";

const options: TSuggestion[] = [
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

const App = () => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
      <h1 className="text-3xl font-bold underline mb-8">
        Intellisense React
      </h1>
      <AutocompleteTextarea options={options} onChange={() => {}} defaultTrigger="{{context." />
    </div>
    
  );
};

export default App;
