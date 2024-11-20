import AutocompleteTextarea from "./AutocompleteTextArea";

const options = [
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
    <AutocompleteTextarea options={options} onChange={() => {}} defaultTrigger="{{context." />
  );
};

export default App;
