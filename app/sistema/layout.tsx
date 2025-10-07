import Navbar from "@/components/navbar";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen ">
      <Navbar />
      <main className="flex-1 transition-all duration-500 px-6">
        {children}
      </main>
    </div>
  );
}
