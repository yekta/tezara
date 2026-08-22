type Props = {
  children: number | string;
};

const locale = "tr";

export default function Highlighted({ children }: Props) {
  return (
    <span className="font-semibold">
      {typeof children === "number"
        ? children.toLocaleString(locale)
        : children}
    </span>
  );
}
