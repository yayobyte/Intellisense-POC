export type TSuggestion = {
    value: string;
    trigger?: string;
    type: string;
    options?: TSuggestion[];
};