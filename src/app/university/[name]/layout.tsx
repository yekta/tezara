type Props = {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
};

export default async function Layout({ children }: Props) {
  return (
    <div className="w-full flex-1 relative flex flex-col md:flex-row md:justify-center text-lg">
      {children}
    </div>
  );
}
