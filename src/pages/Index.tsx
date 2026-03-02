import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FacilitiesSection from "@/components/FacilitiesSection";
import FarmingPhotosCarousel from "@/components/FarmingPhotosCarousel";
import FeedbackSection from "@/components/FeedbackSection";
import WhatsAppSection from "@/components/WhatsAppSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FacilitiesSection />
      <FarmingPhotosCarousel />
      <FeedbackSection />
      <WhatsAppSection />
      <Footer />
    </div>
  );
};

export default Index;
