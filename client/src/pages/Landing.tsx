import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Bot, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="p-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Bot className="text-white h-5 w-5" />
          </div>
          <span className="font-display font-bold text-lg">Nexus AI</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
            Sign In
          </Button>
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Nexus AI v2.0 Live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
            Deploy Your <br/>
            <span className="text-gradient-primary">Autonomous Workforce</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Orchestrate specialized AI agents for HR, Sales, and Support. 
            Scale your operations with zero friction and enterprise-grade security.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-12 shadow-xl shadow-primary/25">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full z-10"
        >
          <FeatureCard 
            icon={<Bot className="h-6 w-6 text-primary" />}
            title="Specialized Agents"
            description="Deploy experts in every field instantly."
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6 text-yellow-400" />}
            title="Real-time Execution"
            description="Tasks completed in milliseconds, not days."
          />
          <FeatureCard 
            icon={<ShieldCheck className="h-6 w-6 text-green-400" />}
            title="Zero Trust Security"
            description="Enterprise-grade encryption by default."
          />
        </motion.div>
      </div>
      
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-white/5">
        © 2025 Nexus AI Platform. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-6 rounded-2xl text-left hover:-translate-y-1 transition-transform duration-300">
      <div className="mb-4 p-3 bg-white/5 w-fit rounded-xl">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
