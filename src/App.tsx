import AutocompleteTextarea from "./AutocompleteTextArea";
import { generateMockSuggestions } from "./mockData";

const options = generateMockSuggestions()

const App = () => {
  console.log(options)
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
