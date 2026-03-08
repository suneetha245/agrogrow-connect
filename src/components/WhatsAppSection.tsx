import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import whatsappQR from "@/assets/whatsapp-qr.jpeg";

const WHATSAPP_LINK = "https://chat.whatsapp.com/LQWPbNtHIsaAHFlOb7Dh81?mode=hqctcla";

const WhatsAppSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 sm:p-16 text-center">
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="inline-flex p-4 rounded-full bg-primary-foreground/20">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-primary-foreground">
              {t("joinWhatsApp")}
            </h2>
            <p className="text-primary-foreground/80 text-lg">{t("whatsAppDesc")}</p>

            {/* QR Code */}
            <div className="inline-block rounded-2xl overflow-hidden border-4 border-primary-foreground/20 shadow-lg">
              <img src={whatsappQR} alt="Scan to join AgroAssist WhatsApp group" className="w-48 h-48 object-cover" />
            </div>
            <p className="text-primary-foreground/70 text-sm">Scan the QR code or click the button below</p>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground font-heading font-bold text-base gap-2 px-8 py-6 mt-4"
              >
                <MessageCircle className="h-5 w-5" />
                {t("joinNow")}
              </Button>
            </a>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-primary-foreground/5" />
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;
