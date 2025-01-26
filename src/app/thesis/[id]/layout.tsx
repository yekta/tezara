import Sidebar from "@/app/thesis/[id]/_components/Sidebar";
import GoBackBar from "@/app/thesis/[id]/go-back-bar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function Layout({ params, children }: Props) {
  const { id } = await params;
  const idNumber = parseInt(Number(id).toString());

  return (
    <div className="w-full flex flex-col items-center flex-1">
      <GoBackBar
        defaultPath="/search"
        buttonText="Geri Dön"
        className="-mb-3 md:mb-0"
      />
      <div className="w-full pt-4 md:pt-3  flex-1 relative flex flex-col md:flex-row md:justify-center px-5 md:px-3 lg:px-5">
        {/* Md left */}
        <Sidebar
          currentThesisId={idNumber}
          side="start"
          className="pr-4 lg:pr-6 pt-0.5 hidden md:flex"
        />
        {children}
        {/* Md right */}
        <Sidebar
          currentThesisId={idNumber}
          side="end"
          className="pl-4 md:pl-6 pt-0.5 hidden md:flex"
        />
      </div>
    </div>
  );
}
