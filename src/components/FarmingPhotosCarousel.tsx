import { useLanguage } from "@/contexts/LanguageContext";
import farm1 from "@/assets/farm-1.jpg";
import farm2 from "@/assets/farm-2.jpg";
import farm3 from "@/assets/farm-3.jpg";
import farm4 from "@/assets/farm-4.jpg";
import farm5 from "@/assets/farm-5.jpg";

const photos = [farm1, farm2, farm3, farm4, farm5, farm1, farm2, farm3, farm4, farm5];

const FarmingPhotosCarousel = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 overflow-hidden">
      <div className="container mb-10">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
            {t("farmingGallery")}
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">{t("farmingGallerySubtitle")}</p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="flex gap-4 animate-scroll-left" style={{ width: "max-content" }}>
          {photos.map((photo, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-48 rounded-xl overflow-hidden shadow-card">
              <img
                src={photo}
                alt={`Farming ${i + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FarmingPhotosCarousel;
