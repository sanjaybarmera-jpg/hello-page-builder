import { Link } from "@tanstack/react-router";
import { MapPin, Phone, MessageCircle, Mail } from "lucide-react";

import { catalogSearch } from "@/components/SiteHeader";

const WHATSAPP = "https://wa.me/919820000000";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl text-primary">Ratan Jewellers</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            BIS hallmarked gold, certified diamonds and hand-finished silver — crafted in our own
            workshops since 1954.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground">Visit us</p>
          <p className="mt-3 flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            12 Zaveri Bazaar Road,
            <br />
            Mumbai 400002
          </p>
          <p className="mt-2 text-xs">GSTIN: 27AAAAA0000A1Z5</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground">Contact</p>
          <a href="tel:+919820000000" className="mt-3 flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4" /> +91 98200 00000
          </a>
          <a
            href="mailto:care@ratanjewellers.in"
            className="mt-2 flex items-center gap-2 hover:text-primary"
          >
            <Mail className="h-4 w-4" /> care@ratanjewellers.in
          </a>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-2 hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp support
          </a>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground">Quick links</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <Link to="/catalog" search={catalogSearch()} className="hover:text-primary">
              All Jewellery
            </Link>
            <Link to="/khata" className="hover:text-primary">
              Track Order / Download Bill
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:text-primary">
              WhatsApp Support
            </a>
            <Link to="/admin/login" className="hover:text-primary">
              Admin Login
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ratan Jewellers. All rights reserved. Prices update with
          live metal rates and include 3% GST.
        </p>
      </div>
    </footer>
  );
}
