import { Link } from "@tanstack/react-router";
import { MapPin, Phone, MessageCircle, Mail, Clock, ShieldCheck, BadgeCheck } from "lucide-react";

import { catalogSearch } from "@/components/SiteHeader";

const WHATSAPP = "https://wa.me/919820000000";

export function SiteFooter() {
  return (
    <>
      <footer className="mt-20 border-t border-gold/40 bg-emerald-deep text-pearl">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-2xl tracking-wide gold-text">NAKKASHI</p>
            <p className="mt-3 text-sm leading-relaxed text-pearl/70">
              Purity • Craft • Honest Pricing — handcrafted silver at direct wholesale rates,
              hallmarked and made in our own workshops.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold-soft">
                <ShieldCheck className="h-3 w-3" /> BIS Hallmark
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold-soft">
                <BadgeCheck className="h-3 w-3" /> 916 Certified
              </span>
            </div>
          </div>

          <div className="text-sm text-pearl/70">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Visit us</p>
            <p className="mt-3 flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              12 Zaveri Bazaar Road,
              <br />
              Mumbai 400002
            </p>
            <p className="mt-3 flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Mon – Sat: 11:00 AM – 8:30 PM
                <br />
                Sunday: 12:00 PM – 6:00 PM
              </span>
            </p>
            <p className="mt-3 text-xs">GSTIN: 27AAAAA0000A1Z5</p>
          </div>

          <div className="text-sm text-pearl/70">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Contact</p>
            <a href="tel:+919820000000" className="mt-3 flex items-center gap-2 hover:text-gold">
              <Phone className="h-4 w-4" /> +91 98200 00000
            </a>
            <a
              href="mailto:support@nakkashi.in"
              className="mt-2 flex items-center gap-2 hover:text-gold"
            >
              <Mail className="h-4 w-4" /> support@nakkashi.in
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 hover:text-gold"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Concierge
            </a>
          </div>

          <div className="text-sm text-pearl/70">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Quick links</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/" className="hover:text-gold">
                Home
              </Link>
              <Link to="/catalog" search={catalogSearch()} className="hover:text-gold">
                All Jewellery
              </Link>
              <Link to="/khata" className="hover:text-gold">
                Track Order / Download Bill
              </Link>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:text-gold">
                WhatsApp Support
              </a>
              <Link to="/admin/login" className="hover:text-gold">
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/20">
          <p className="mx-auto max-w-6xl px-6 py-6 text-xs text-pearl/60">
            © {new Date().getFullYear()} NAKKASHI. All rights reserved. Prices update with
            live metal rates and include 3% GST.
          </p>
        </div>
      </footer>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-gold/50 bg-emerald-deep px-5 py-3 text-xs font-medium tracking-wide text-pearl shadow-xl transition-transform hover:-translate-y-0.5 print:hidden"
      >
        <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp Concierge
      </a>
    </>
  );
}
