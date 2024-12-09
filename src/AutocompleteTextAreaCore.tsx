/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: fix usage of any as this is a library from npm

/*
This is a fork of
https://github.com/yury-dymov/react-autocomplete-input
version 1.0.31
*/

import type {
  ChangeEvent,
  ComponentProps,
  ForwardRefExoticComponent,
  MutableRefObject,
  ReactNode,
  RefObject,
} from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "throttle-debounce";
import getCaretCoordinates from "textarea-caret";
import getInputSelection, { setCaretPosition } from "get-input-selection";

const findActiveTriggerContext = (text: string, cursorIndex: number, listOfTriggers: string[]) => {
  // Find the last trigger before the cursor
  for (let i = cursorIndex; i >= 0; i--) {
    const slice = text.slice(i, cursorIndex);
    if (slice.length > 0 && listOfTriggers.includes(slice)) {
      return { trigger: slice, startIndex: i };
    }
  }
  return null;
};

const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RETURN = 13;
const KEY_ENTER = 14;
const KEY_ESCAPE = 27;
const KEY_TAB = 9;
const KEY_BACKSPACE = 8;

const OPTION_LIST_MIN_WIDTH = 100;

export type TextAreaAutocompleteProps<C extends string | ForwardRefExoticComponent<any>> = {
  Component?: C;
  defaultValue?: string;
  disabled?: boolean;
  maxOptions?: number;
  onBlur?: (...args: any[]) => void;
  onChange?: (value: string) => void;
  onKeyDown?: (...args: any[]) => void;
  onRequestOptions?: (value: string) => void;
  onSelect?: (...args: any[]) => void;
  changeOnSelect?: (trigger: string | string[], slug: string) => string;
  options?: Record<string, string[]> | string[];
  regex?: string;
  matchAny?: boolean;
  minChars?: number;
  spaceRemovers?: string[];
  spacer?: string;
  trigger?: string | string[];
  value?: string;
  offsetX?: number;
  offsetY?: number;
  passThroughEnter?: boolean;
  passThroughTab?: boolean;
  triggerMatchWholeWord?: boolean;
  triggerCaseInsensitive?: boolean;
  suggestionsRef?: MutableRefObject<HTMLUListElement>
} & Omit<ComponentProps<any>, "onChange">;

export const TextAreaAutocomplete = forwardRef<HTMLInputElement, TextAreaAutocompleteProps<any>>(
  (
    {
      Component,
      defaultValue,
      disabled,
      maxOptions = 4,
      onBlur,
      onChange,
      onKeyDown,
      onRequestOptions,
      onSelect,
      changeOnSelect = (trigger, slug) => trigger + slug,
      options = [],
      regex = "^[A-Za-z0-9\\-_.!]+$",
      matchAny,
      minChars = 0,
      spaceRemovers = [",", "?"],
      spacer = " ",
      trigger = "@",
      offsetX = 0,
      offsetY = 0,
      value,
      passThroughEnter,
      passThroughTab = true,
      triggerMatchWholeWord,
      triggerCaseInsensitive,
      suggestionsRef: refParent,
      ...rest
    },
    ref
  ) => {

    const [helperVisible, setHelperVisible] = useState(false);
    const [left, setLeft] = useState(0);
    const [stateTrigger, setStateTrigger] = useState<string | null>(null);
    const [matchLength, setMatchLength] = useState(0);
    const [matchStart, setMatchStart] = useState(0);
    const [stateOptions, setStateOptions] = useState<string[]>([]);
    const [selection, setSelection] = useState(0);
    const [top, setTop] = useState(0);
    const [stateValue, setStateValue] = useState<string | null>(null);
    const [caret, setCaret] = useState<number | null>(null);

    const recentValue = useRef(defaultValue);
    const enableSpaceRemovers = useRef(false);

    const internalRefInput = useRef<HTMLInputElement>(null);

    const refInput = (ref as RefObject<HTMLInputElement>) || internalRefInput;
    const refCurrent = useRef<HTMLLIElement>(null);

    const handleResize = () => {
      setHelperVisible(false);
    };

    const handleOnRequestOptionsDebounce = useCallback(
      debounce(
        100,
        (...args: Parameters<NonNullable<typeof onRequestOptions>>) => {
          onRequestOptions?.(...args);
        }
      ),
      []
    );

    const arrayTriggerMatch = (triggers: string[], re: RegExp) => {
      const triggersMatch = triggers.map((trigger) => ({
        triggerStr: trigger,
        triggerMatch: trigger.match(re),
        triggerLength: trigger.length,
      }));

      return triggersMatch;
    };

    const isTrigger = (passedTrigger: string, str: string, i: number) => {
      if (!passedTrigger || !passedTrigger.length) {
        return true;
      }

      if (triggerMatchWholeWord && i > 0 && str.charAt(i - 1).match(/[\w]/)) {
        return false;
      }

      if (
        str.substr(i, passedTrigger.length) === passedTrigger || // TODO replace deprecated substr
        (triggerCaseInsensitive &&
          str.substr(i, passedTrigger.length).toLowerCase() === // TODO replace deprecated substr
            passedTrigger.toLowerCase())
      ) {
        return true;
      }

      return false;
    };

    const getMatch = (
      str: string,
      caret: number,
      providedOptions: TextAreaAutocompleteProps<any>["options"]
    ) => {
      const re = new RegExp(regex);

      const triggers = (
        !Array.isArray(trigger) ? new Array(trigger) : trigger
      ).sort();

      const providedOptionsObject = triggers.reduce((acc, eachTrigger) => {
        if (Array.isArray(providedOptions)) {
          acc[eachTrigger] = providedOptions;
        }
        return acc;
      }, {} as Record<string, string[]>);

      const triggersMatch = arrayTriggerMatch(triggers, re);

      let slugData: {
        trigger: string;
        matchStart: number;
        matchLength: number;
        options: string[];
      } | null = null;

      for (
        let triggersIndex = 0;
        triggersIndex < triggersMatch.length;
        triggersIndex++
      ) {
        const { triggerStr, triggerMatch, triggerLength } =
          triggersMatch[triggersIndex];

        for (let i = caret - 1; i >= 0; --i) {
          const substr = str.substring(i, caret);
          const match = substr.match(re);
          let matchStart = -1;

          if (triggerLength > 0) {
            const triggerIdx = triggerMatch ? i : i - triggerLength + 1;

            if (triggerIdx < 0) {
              // out of input
              break;
            }

            if (isTrigger(triggerStr, str, triggerIdx)) {
              matchStart = triggerIdx + triggerLength;
            }

            if (!match && matchStart < 0) {
              break;
            }
          } else {
            if (match && i > 0) {
              // find first non-matching character or begin of input
              continue;
            }
            matchStart = i === 0 && match ? 0 : i + 1;

            if (caret - matchStart === 0) {
              // matched slug is empty
              break;
            }
          }

          if (matchStart >= 0) {
            const triggerOptions = providedOptionsObject[triggerStr];
            if (!triggerOptions) {
              continue;
            }

            const matchedSlug = str.substring(matchStart, caret);

            const options = triggerOptions.filter((slug) => {
              const idx = slug.toLowerCase().indexOf(matchedSlug.toLowerCase());
              return idx !== -1 && (matchAny || idx === 0);
            });

            const currTrigger = triggerStr;
            const matchLength = matchedSlug.length;

            if (!slugData) {
              slugData = {
                trigger: currTrigger,
                matchStart,
                matchLength,
                options,
              };
            } else {
              slugData = {
                ...(slugData as Record<string, any>),
                trigger: currTrigger,
                matchStart,
                matchLength,
                options,
              };
            }
          }
        }
      }

      return slugData;
    };

    const updateHelper = (
      str: string,
      caret: number,
      passedOptions: NonNullable<TextAreaAutocompleteProps<any>["options"]>,
      makeRequest = true
    ) => {
      const input = refInput.current!;
      const slug = getMatch(str, caret, passedOptions);

      if (slug) {
        const caretPos = getCaretCoordinates(input, caret);
        const { top, left, width } = input.getBoundingClientRect();

        const isCloseToEnd = width - caretPos.left < 150;
        const topOffset = top + window.scrollY;
        const leftOffset = left + window.scrollX;

        const newTop = caretPos.top + topOffset - input.scrollTop + 24;
        const newLeft = Math.min(
          /* Fully inside the viewport */
          caretPos.left + leftOffset - input.scrollLeft - slug.matchLength,
          /* Ensure minimal width inside viewport */
          window.innerWidth - OPTION_LIST_MIN_WIDTH
        );

        if (slug.matchLength >= minChars) {
          if (makeRequest) {
            handleOnRequestOptionsDebounce(
              str.substr(slug.matchStart, slug.matchLength) // TODO replace deprecated substr
            );
          }
          setTop(newTop);
          setLeft(isCloseToEnd ? newLeft - 175 : newLeft);
          setStateTrigger(slug.trigger);
          setStateOptions(slug.options);
          setMatchLength(slug.matchLength);
          setMatchStart(slug.matchStart);
          setHelperVisible(true);
        } else {
          resetHelper();
          setStateTrigger(null);
        }
      } else {
        resetHelper();
        setStateTrigger(null);
      }
    };


    useEffect(() => {
      if (stateOptions.length && refParent.current) {
        refParent.current.focus();
      }
    }, [stateOptions]);
    
    useEffect(() => {
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    useEffect(() => {
      if (typeof caret === "number" && !!options) {
        updateHelper(recentValue.current!, caret, options, false);
      }
    }, [JSON.stringify(options)]);

    useEffect(() => {
      if (helperVisible && refCurrent.current) {
        refCurrent.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, [helperVisible]);

    const resetHelper = () => {
      setHelperVisible(false);
      setSelection(0);
    };

    const updateCaretPosition = (caret: number) => {
      setCaret(caret);
      setCaretPosition(refInput.current, caret);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const old = recentValue.current;
      const str = e.target.value;
      const caret = getInputSelection(e.target).end;

      if (!str.length) {
        setHelperVisible(false);
      }

      recentValue.current = str;

      setCaret(caret);
      setStateValue(str);

      if (!str.length || !caret) {
        return onChange?.(e.target.value);
      }

      // '@wonderjenny ,|' -> '@wonderjenny, |'
      if (
        enableSpaceRemovers.current &&
        spaceRemovers.length &&
        str.length > 2 &&
        spacer.length
      ) {
        for (let i = 0; i < Math.max(old!.length, str.length); ++i) {
          if (old![i] !== str[i]) {
            if (
              i >= 2 &&
              str[i - 1] === spacer &&
              spaceRemovers.indexOf(str[i - 2]) === -1 &&
              spaceRemovers.indexOf(str[i]) !== -1 &&
              getMatch(str.substring(0, i - 2), caret - 3, options!)
            ) {
              const newValue = `${str.slice(0, i - 1)}${str.slice(
                i,
                i + 1
              )}${str.slice(i - 1, i)}${str.slice(i + 1)}`;

              updateCaretPosition(i + 1);
              if (refInput.current) {
                refInput.current.value = newValue;
              }

              if (!value) {
                setStateValue(newValue);
              }

              return onChange?.(newValue);
            }

            break;
          }
        }

        enableSpaceRemovers.current = false;
      }

      updateHelper(str, caret, options!);

      if (!value) {
        setStateValue(e.target.value);
      }

      return onChange?.(e.target.value);
    };

    const handleBlur = (e: KeyboardEvent) => {
      resetHelper();
      onBlur?.(e);
    };

    const handleSelection = (idx: number) => {
      const slug = stateOptions[idx]; // Selected suggestion
      if (!slug) { return } // Prevents error when pressing enter just right after the final suggestion
      const value = recentValue.current!;
      const triggerLength = stateTrigger?.length || 0;

      // Calculate part1 correctly: up to matchStart (excluding stateTrigger itself)
      const part1 = value.substring(0, matchStart - triggerLength);

      // part2 remains unchanged
      const part2 = value.substring(matchStart + matchLength);

      // Generate the new string to insert
      const changedStr = changeOnSelect(stateTrigger!, slug);

      // Construct the new value
      const event = { target: refInput.current! };
      event.target.value = `${part1}${changedStr}${spacer || ""}${part2}`;

      // Update the textarea value
      handleChange(event as any);
      onSelect?.(event.target.value);

      // Reset helpers and caret position
      resetHelper();

      const advanceCaretDistance =
        part1.length + changedStr.length + (spacer ? spacer.length : 0);

      updateCaretPosition(advanceCaretDistance);

      enableSpaceRemovers.current = true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const optionsCount =
        maxOptions > 0
          ? Math.min(stateOptions!.length, maxOptions)
          : stateOptions!.length;

      if (helperVisible) {
        switch (event.keyCode) {
          case KEY_ESCAPE:
            event.preventDefault();
            resetHelper();
            break;
          case KEY_UP:
            event.preventDefault();
            if (optionsCount > 0) {
              setSelection(
                Math.max(0, optionsCount + selection - 1) % optionsCount
              );
            }
            break;
          case KEY_DOWN:
            event.preventDefault();
            if (optionsCount > 0) {
              setSelection((selection + 1) % optionsCount);
            }
            break;
          case KEY_ENTER:
          case KEY_RETURN:
            if (!passThroughEnter) {
              event.preventDefault();
            }
            handleSelection(selection);
            break;
          case KEY_TAB:
            if (!passThroughTab) {
              event.preventDefault();
            }
            handleSelection(selection);
            break;
          case KEY_BACKSPACE:
            if (stateTrigger) {
              const triggerContext = findActiveTriggerContext(recentValue.current!, getInputSelection(refInput.current!).end, Array.isArray(options) ? options : []);
              if (triggerContext) {
                setStateTrigger(triggerContext.trigger);
              } else {
                resetHelper();
                setStateTrigger(null);
              }
            } else {
              resetHelper();
            }
            break;
          default:
            onKeyDown?.(event);
            break;
        }
      } else {
        onKeyDown?.(event);
      }
    };

    const renderAutocompleteList = () => {
      if (!helperVisible) {
        return null;
      }

      if (stateOptions.length === 0) {
        return null;
      }

      if (selection >= stateOptions.length) {
        setSelection(0);

        return null;
      }

      const optionNumber = maxOptions === 0 ? stateOptions.length : maxOptions;

      const helperOptions = stateOptions
        .slice(0, optionNumber)
        .map((val, idx) => {
          const highlightStart = val
            .toLowerCase()
            .indexOf(stateValue!.substr(matchStart, matchLength).toLowerCase()); // TODO replace deprecated substr

            return (
              <li
                className={`cursor-pointer px-2.5 py-1 min-w-60 h-5 font-bold flex items-center justify-between ${
                  idx === selection ? "bg-yellow-300 text-gray-800" : ""
                }`}
                ref={idx === selection ? refCurrent : undefined}
                key={val}
                onClick={() => {
                  handleSelection(idx);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onMouseEnter={() => {
                  setSelection(idx);
                }}
              >
                <p>
                  {val.slice(0, highlightStart)}
                  <strong>{val.slice(highlightStart, highlightStart + matchLength)}</strong>
                  {val.slice(highlightStart + matchLength)}
                </p>
              </li>
            );
        });

      const BORDER_WIDTH = 1; // 1px border
      const PADDING = 16; // 4rem = 16px
      const MARGIN = 16; // 5px safety margin
      const MIN_HEIGHT = 50; // Minimum height for the dropdown
      const MAX_HEIGHT = 200; // Maximum height for the dropdown
      const MAX_VISIBLE_ITEMS = 5; // Maximum number of items to show before scrolling
      const ITEM_HEIGHT = 20; // Height in pixels for each dropdown item

      // Calculate dimensions
      const maxWidth = window.innerWidth - left - offsetX - (2 * BORDER_WIDTH) - (2 * PADDING) - MARGIN;
      const maxHeight = Math.min(
        window.innerHeight - top - offsetY - (2 * BORDER_WIDTH) - (2 * PADDING) - MARGIN,
        stateOptions.length > MAX_VISIBLE_ITEMS ? MAX_HEIGHT : MIN_HEIGHT + (stateOptions.length * ITEM_HEIGHT)
      );

      return (
          <ul
            className="bg-white border border-black/15 shadow-lg fixed text-left z-[20000] list-none mt-4 p-0 text-md 
                       overflow-y-auto overflow-x-hidden focus:outline-none"
            style={{
              left: left + offsetX,
              top: top + offsetY,
              maxHeight,
              maxWidth,
              minHeight: MIN_HEIGHT,
              boxSizing: 'border-box',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
            ref={refParent}
            id="suggestions-list"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onScroll={(e) => e.stopPropagation()}
          >
            {helperOptions}
          </ul>
        );
    };

    const val =
      typeof value !== "undefined" && value !== null
        ? value
        : stateValue
        ? stateValue
        : defaultValue;

    return (
      <>
        <Component
          disabled={disabled}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={refInput}
          value={val}
          {...rest}
        />
        {renderAutocompleteList()}
      </>
    );
  }
);

TextAreaAutocomplete.displayName = "TextAreaAutocomplete";

export default TextAreaAutocomplete as <
  C extends string | ForwardRefExoticComponent<any>
>(
  props: TextAreaAutocompleteProps<C> & { ref?: RefObject<HTMLInputElement | HTMLTextAreaElement> }
) => ReactNode;
