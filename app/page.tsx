import { Header } from "@/components/header";
import { LandingPage } from "@/components/landing-page";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LandingPage />
    </div>
  );
}
