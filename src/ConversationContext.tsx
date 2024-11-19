import React, { createContext, useState, useContext } from "react";

interface Customer {
  name: string;
  email: string;
  age: number
  getFormattedAddress: () => string;
  getMobilePhone: () => string
}

interface ConversationContextInterface {
  customer: Customer;
  chatHistory: string[];
}

const ConversationContext = createContext<ConversationContextInterface>({
  customer: {
    name: "",
    email: "",
    age: 0,
    getFormattedAddress: () => "",
    getMobilePhone: () => "",
  },
  chatHistory: [],
});

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    age: 0,
    getFormattedAddress: () => "",
    getMobilePhone: () => "",
  });
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  return (
    <ConversationContext.Provider value={{ customer, chatHistory }}>
      {children}
    </ConversationContext.Provider>
  );
};

export default ConversationContext;
