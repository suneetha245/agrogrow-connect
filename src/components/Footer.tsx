import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="border-t border-border bg-card py-16">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
              <span className="font-heading font-extrabold text-primary text-lg">AgroAssist</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{t("footerDesc")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">{t("quickLinks")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#facilities" className="text-muted-foreground hover:text-primary transition-colors">{t("facilities")}</a></li>
              <li><a href="/#about" className="text-muted-foreground hover:text-primary transition-colors">{t("about")}</a></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">{t("login")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">{t("supportTitle")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("helpCenter")}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("privacyPolicy")}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("termsOfService")}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-4">{t("contact")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📧 suneethanaik232@gmail.com</li>
              <li>📞 +91 XXXXX XXXXX</li>
              <li>📍 Karnataka, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © 2026 AgroAssist. {t("allRightsReserved")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
