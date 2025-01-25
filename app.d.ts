declare module "lucide-react" {
  export * from "lucide-react/dist/lucide-react.suffixed";
}

export type TUmamiTrackFunction = (
  event: string,
  props?: Record<string, string | number>
) => void;

declare global {
  interface Window {
    umami?: {
      track: TUmamiTrackFunction;
    };
  }
}

export default global;
