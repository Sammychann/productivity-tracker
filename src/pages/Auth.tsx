import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputCls = "bg-[#161616] border-[#222] text-white placeholder:text-[#444] focus:border-primary/50 h-11";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(isLogin ? "Logging in..." : "Signing up...");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!", { id: toastId });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Welcome.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0d0d0d" }}>
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl p-8 space-y-8" 
        style={{ background: "#111", border: "1px solid #1d1d1d" }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm" style={{ color: "#666" }}>
            {isLogin ? "Enter your details to access your goals" : "Start tracking your productivity today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">Email</Label>
            <Input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className={inputCls} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className={inputCls} 
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary hover:bg-primary/90 font-semibold mt-2 h-11"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </Button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm hover:underline" 
            style={{ color: "#666" }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
