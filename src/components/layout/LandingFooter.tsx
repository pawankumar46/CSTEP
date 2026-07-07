import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <BrandLogo height={36} href="/" />
            <p className="text-sm text-muted-foreground max-w-xs">{APP_DESCRIPTION}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={ROUTES.signup} className="hover:text-foreground">Sign Up</Link></li>
              <li><Link href={ROUTES.login} className="hover:text-foreground">Sign In</Link></li>
              <li><Link href={ROUTES.eventRegister} className="hover:text-foreground">Event Registration</Link></li>
              <li><Link href="/streaming" className="hover:text-foreground">Live Stream</Link></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:support@cstep.com" className="hover:text-foreground">support@cstep.com</a></li>
             
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
