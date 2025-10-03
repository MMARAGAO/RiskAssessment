import Navbar from "@/components/navbar";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-t from-white from-50% to-zinc-100 to-50% dark:from-black dark:from-50% dark:to-zinc-950 dark:to-50%">
      <Navbar />
      <main className="flex-1 transition-all duration-500">{children}</main>
    </div>
  );
}
