import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, TrendingUp } from "lucide-react";

interface HeroProps {
  onGetStartedClick: () => void;
}

const Hero = ({ onGetStartedClick }: HeroProps) => {
  return (
    <section className="relative pt-32 pb-20 px-6 hero-gradient overflow-hidden">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />
      
      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-muted-foreground text-sm font-medium mb-8 animate-fade-in shadow-sm border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          For Emerging Developer Academy Members
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6 animate-slide-up">
          Build Lender-Ready
          <br />
          <span className="text-primary">Development Packages</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          The guided platform for emerging real estate developers to create professional financing documents for 1-4 unit residential projects
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button variant="accent" size="xl" onClick={onGetStartedClick}>
            Get Started
          </Button>
          <Button variant="outline" size="xl" className="border-2 border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white">
            See How It Works
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="inline-block bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 px-8 py-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-4">Trusted by developers across Memphis</p>
            <div className="flex items-center justify-center gap-8 text-muted-foreground">
              <div className="text-center flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">50+</div>
                  <div className="text-sm">Projects Created</div>
                </div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">$2M+</div>
                  <div className="text-sm">Financing Secured</div>
                </div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm">Approval Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
