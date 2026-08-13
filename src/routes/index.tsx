import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hi — A Simple Greeting Page" },
      {
        name: "description",
        content: "A minimal greeting page that simply says hi, built with a clean and calm design.",
      },
      { property: "og:title", content: "Hi — A Simple Greeting Page" },
      {
        property: "og:description",
        content: "A minimal greeting page that simply says hi, built with a clean and calm design.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Welcome</p>
        <h1 className="mt-4 text-7xl font-bold tracking-tight text-foreground sm:text-8xl">hi</h1>
        <p className="mt-6 text-base text-muted-foreground">
          Nice to see you here. This is your hi page.
        </p>
      </div>
    </main>
  );
}
