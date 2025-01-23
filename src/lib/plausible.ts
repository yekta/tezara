import { usePlausible as usePlausibleUntyped } from "next-plausible";

type Events = {
  "Prev/Next Thesis Button Clicked": {
    "From Thesis ID": number;
    "To Thesis ID": number;
  };
  "Prev/Next Search Result Page Button Clicked": {
    "From Page": number;
    "To Page": number | string;
  };
  Searched: {
    Query: string;
    Variant: string;
  };
  "Advance Search Clicked": Record<string, string>;
  "Year GTE Filter Clicked": Record<string, string>;
  "Year LTE Filter Clicked": Record<string, string>;
  "University Filter Clicked": Record<string, string>;
  "Department Filter Clicked": Record<string, string>;
  "Thesis Type Filter Clicked": Record<string, string>;
  "Language Filter Clicked": Record<string, string>;
  "Author Filter Clicked": Record<string, string>;
  "Advisor Filter Clicked": Record<string, string>;
  "Downloaded Bulk CSV": {
    "Row Count": number;
    "Size (MB)": number;
  };
  "Downloaded Bulk JSON": {
    "Row Count": number;
    "Size (MB)": number;
  };
};

export const usePlausible = () => usePlausibleUntyped<Events>();
