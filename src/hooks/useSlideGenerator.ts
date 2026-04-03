"use client";

import { useReducer, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SlideEntry, GeneratedSlide } from "@/lib/types";
import { splitTextIntoSlides, formatSlideText } from "@/lib/textSplitter";

interface State {
  entries: SlideEntry[];
  generatedSlides: GeneratedSlide[];
  layoutRatio: number;
  isGenerated: boolean;
}

type Action =
  | { type: "ADD_ENTRY" }
  | { type: "REMOVE_ENTRY"; id: string }
  | { type: "UPDATE_ENTRY_TEXT"; id: string; text: string }
  | {
      type: "SET_ENTRY_IMAGE";
      id: string;
      file: File | null;
      dataUrl: string | null;
    }
  | { type: "SET_LAYOUT_RATIO"; ratio: number }
  | { type: "GENERATE_SLIDES" }
  | { type: "RESET" };

function createEmptyEntry(): SlideEntry {
  return {
    id: uuidv4(),
    text: "",
    imageFile: null,
    imageDataUrl: null,
  };
}

const initialState: State = {
  entries: [createEmptyEntry()],
  generatedSlides: [],
  layoutRatio: 0.65,
  isGenerated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ENTRY":
      return {
        ...state,
        entries: [...state.entries, createEmptyEntry()],
        isGenerated: false,
      };

    case "REMOVE_ENTRY":
      if (state.entries.length <= 1) return state;
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.id),
        isGenerated: false,
      };

    case "UPDATE_ENTRY_TEXT":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.id ? { ...e, text: action.text } : e
        ),
        isGenerated: false,
      };

    case "SET_ENTRY_IMAGE":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.id
            ? { ...e, imageFile: action.file, imageDataUrl: action.dataUrl }
            : e
        ),
        isGenerated: false,
      };

    case "SET_LAYOUT_RATIO":
      return {
        ...state,
        layoutRatio: action.ratio,
        isGenerated: false,
      };

    case "GENERATE_SLIDES": {
      let slideIndex = 0;
      const generatedSlides: GeneratedSlide[] = [];

      for (const entry of state.entries) {
        if (!entry.text.trim()) continue;

        const chunks = splitTextIntoSlides(entry.text);
        for (const chunk of chunks) {
          generatedSlides.push({
            id: uuidv4(),
            entryId: entry.id,
            text: formatSlideText(chunk),
            imageDataUrl: entry.imageDataUrl,
            slideIndex: slideIndex++,
          });
        }
      }

      return {
        ...state,
        generatedSlides,
        isGenerated: true,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useSlideGenerator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addEntry = useCallback(() => dispatch({ type: "ADD_ENTRY" }), []);
  const removeEntry = useCallback(
    (id: string) => dispatch({ type: "REMOVE_ENTRY", id }),
    []
  );
  const updateEntryText = useCallback(
    (id: string, text: string) =>
      dispatch({ type: "UPDATE_ENTRY_TEXT", id, text }),
    []
  );

  const setEntryImage = useCallback(
    (id: string, file: File | null) => {
      if (!file) {
        dispatch({ type: "SET_ENTRY_IMAGE", id, file: null, dataUrl: null });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({
          type: "SET_ENTRY_IMAGE",
          id,
          file,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const setLayoutRatio = useCallback(
    (ratio: number) => dispatch({ type: "SET_LAYOUT_RATIO", ratio }),
    []
  );
  const generateSlides = useCallback(
    () => dispatch({ type: "GENERATE_SLIDES" }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    ...state,
    addEntry,
    removeEntry,
    updateEntryText,
    setEntryImage,
    setLayoutRatio,
    generateSlides,
    reset,
  };
}
