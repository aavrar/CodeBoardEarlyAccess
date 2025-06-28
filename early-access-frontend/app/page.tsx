"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import React from "react";
import {
  Globe,
  Users,
  BarChart3,
  BookOpen,
  ArrowRight,
  Database,
  CheckCircle,
  Star,
  Zap,
  Crown,
  Mail,
  Calendar,
  Gift,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CodeSwitchingDemo } from "@/components/code-switching-demo"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [emailOptIn, setEmailOptIn] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user, logout } = useAuth()

  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/oauth/google`;
  };

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const signupSuccess = urlParams.get('signupSuccess');
    const signupError = urlParams.get('error');
    const method = urlParams.get('method');
    const existingUser = urlParams.get('existingUser');

    if (signupSuccess === 'true') {
      if (existingUser === 'true') {
        toast({
          title: "Already Signed Up!",
          description: "You've already signed up to be part of CodeBoard, thank you for your patience, we promise that you will be among the first to know when the platform is ready.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      toast({
        title: "Welcome to CodeBoard! 🎉",
        description: `You're now on our early access list with researcher privileges via ${method || 'email'}.`,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (signupError) {
      let errorMessage = "An error occurred during sign-up.";
      if (signupError === 'oauth_denied') {
        errorMessage = "Google sign-in was cancelled or denied.";
      } else if (signupError === 'missing_code') {
        errorMessage = "Missing authentication code from Google.";
      } else if (signupError === 'no_email') {
        errorMessage = "Could not retrieve email from Google account.";
      } else if (signupError === 'oauth_server_error') {
        errorMessage = "An internal server error occurred during Google sign-in.";
      }
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, emailOptIn }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyExists) {
          toast({
            title: "Already Signed Up!",
            description: "You've already signed up to be part of CodeBoard, thank you for your patience, we promise that you will be among the first to know when the platform is ready.",
          });
          setEmail('');
          setName('');
          setPassword('');
          return; // Do not show thank you page
        }
        setIsSubmitted(true);
        toast({
          title: "Welcome to CodeBoard! 🎉",
          description: data.message || "You're now on our early access list with researcher privileges.",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return <ThankYouPage email={email} name={name} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-neutral-50">
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">CodeBoard</span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Early Access
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-neutral-600">
                  Welcome, {user.name || user.email.split('@')[0]}!
                </span>
                <Button variant="ghost" size="sm" onClick={logout} className="text-neutral-600 hover:text-red-600">
                  Sign Out
                </Button>
                <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/contribute">Contribute</Link>
                </Button>
              </div>
            ) : (
              <>
                <LoginModal>
                  <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-teal-600">
                    Sign In
                  </Button>
                </LoginModal>
                <Badge variant="outline" className="text-teal-600 border-teal-600">
                  Coming Soon
                </Badge>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-teal-600 hover:bg-teal-700 mb-4">
              <Star className="h-3 w-3 mr-1" />
              Limited Early Access
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
              The Future of <span className="text-teal-600">Code-Switching</span> Research is Here
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed max-w-3xl mx-auto mb-8">
              CodeBoard is a solo student led initiative, planning on revolutionizing how we understand multilingual communication. Be among the first researchers
              to access our comprehensive code-switching corpus platform.
            </p>
          </div>

          {/* Early Access Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-teal-600 p-3 rounded-full">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-teal-900 mb-2">Researcher Access</h3>
                <p className="text-sm text-teal-700">
                  Get guaranteed 'Researcher' role - otherwise reserved for select users post-launch.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-amber-600 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-amber-900 mb-2">First Access</h3>
                <p className="text-sm text-amber-700">
                  Gain <b>INSTANT ACCESS</b> to contribute to our growing corpus of real-world code-switching examples
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-emerald-600 p-3 rounded-full">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-emerald-900 mb-2">Exclusive Perks</h3>
                <p className="text-sm text-emerald-700">
                  Direct input on features, priority support, and lifetime researcher benefits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <Card id="signup" className="max-w-md mx-auto border-neutral-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5 text-teal-600" />
                Join Early Access
              </CardTitle>
              <CardDescription>Secure your free researcher account today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="emailOptIn" 
                    checked={emailOptIn} 
                    onCheckedChange={(checked) => setEmailOptIn(checked === true)}
                    className="border-teal-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <Label htmlFor="emailOptIn" className="text-sm text-neutral-600 cursor-pointer">
                    Send me updates about CodeBoard's launch and new features
                  </Label>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                  {isLoading ? "Securing Your Spot..." : "Get Free Researcher Access"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-neutral-500 text-center">No spam, ever. Unsubscribe anytime.</p>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-500">Or continue with</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-white hover:bg-neutral-50"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.0003 4.75C14.0263 4.75 15.8473 5.448 17.2403 6.718L20.0303 3.928C18.0523 2.096 15.2303 1 12.0003 1C7.72931 1 3.92131 3.472 2.03031 7.058L5.00031 9.348C5.84831 6.718 8.65031 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.0003 12.0003C23.0003 11.3483 22.9403 10.7203 22.8263 10.1253H12.0003V14.6253H18.4403C18.1803 15.9363 17.3303 17.0803 16.2003 17.8683L19.2003 20.2863C20.9503 18.6963 22.0003 16.4303 22.0003 12.0003H23.0003Z" fill="#4285F4" />
                  <path d="M5.00031 9.34801L2.03031 7.05801C1.38031 8.37801 1.00031 9.92801 1.00031 12.0003C1.00031 14.0723 1.38031 15.6223 2.03031 16.9423L5.00031 14.6523C4.15231 12.0003 4.15231 9.34801 5.00031 9.34801Z" fill="#FBBC05" />
                  <path d="M12.0003 23.0003C15.2303 23.0003 18.0523 21.9043 20.0303 20.0723L17.2403 17.2823C15.8473 18.5523 14.0263 19.2503 12.0003 19.2503C8.65031 19.2503 5.84831 17.2823 5.00031 14.6523L2.03031 16.9423C3.92131 20.5283 7.72931 23.0003 12.0003 23.0003Z" fill="#34A853" />
                </svg>
                Sign up with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <CodeSwitchingDemo />

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Why CodeBoard?</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Understanding code-switching helps us better comprehend multilingual communication and build more
              inclusive language technologies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-neutral-900">Community-Driven</CardTitle>
                <CardDescription>
                Built by and for multilingual speakers who understand the nuances of code-switching. Connect with fellow researchers, share insights, and collaborate on groundbreaking studies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-neutral-900">Rich Analytics</CardTitle>
                <CardDescription>
                  Explore patterns, frequencies, and linguistic insights from real-world data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-neutral-900">Research-Ready</CardTitle>
                <CardDescription>
                  Structured data perfect for linguistic research and NLP model training.
                </CardDescription>
              </CardHeader>
            </Card>

          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">What You'll Get Access To</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              CodeBoard brings together the world's most comprehensive code-switching research tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-lg">Massive Corpus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  50,000+ verified code-switching examples across 30+ language pairs from real-world conversations
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Powerful visualization tools, pattern recognition, and statistical analysis for your research
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Research Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Export data, create custom datasets, and integrate with your existing research workflow
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Connect with fellow researchers, share insights, and collaborate on groundbreaking studies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Launch Timeline</h2>
            <p className="text-xl text-neutral-600">Here's what to expect in the coming weeks/months</p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-teal-600 p-2 rounded-full flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Phase 1: Early Access Signup & Initial Development</h3>
                <p className="text-neutral-600 text-sm">Collect researcher interest and build our community</p>
                <Badge variant="secondary" className="mt-2 bg-teal-100 text-teal-800">
                  Current Phase
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-amber-600 p-2 rounded-full flex-shrink-0">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Phase 2: Beta Launch</h3>
                <p className="text-neutral-600 text-sm">Limited beta access for early adopters with core features</p>
                <Badge variant="outline" className="mt-2">
                  Expected by end of July
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-600 p-2 rounded-full flex-shrink-0">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Phase 3: Full Launch</h3>
                <p className="text-neutral-600 text-sm">Complete platform with all features and public access</p>
                <Badge variant="outline" className="mt-2">
                  By Winter 2025
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Trusted by Leading Researchers</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">500+</div>
              <div className="text-teal-100">Researchers Signed Up</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">25+</div>
              <div className="text-teal-100">Universities Interested</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">15+</div>
              <div className="text-teal-100">Countries Represented</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - TODO: Replace with real-time statistics from backend */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-teal-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">15,000+</div>
              <div className="text-teal-100">Code-switching Examples</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">30+</div>
              <div className="text-teal-100">Language Pairs</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">1,200+</div>
              <div className="text-teal-100">Active Contributors</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">50+</div>
              <div className="text-teal-100">Countries Represented</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">Ready to Contribute?</h2>
          <p className="text-xl text-neutral-600 mb-8">
            Help us build the world's most comprehensive code-switching corpus. Every example you share helps advance
            multilingual research.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
              <Link href="/contribute">
                Submit Your First Example
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-neutral-300 bg-transparent">
              <Link href="#signup">Learn More About the Project</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CodeBoard</span>
          </div>
          <p className="text-neutral-400 text-sm">© 2025 Aahad Vakani. Building the future of multilingual research.</p>
        </div>
      </footer>
    </div>
  )
}

function ThankYouPage({ email, name }: { email: string; name: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="bg-teal-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Welcome to CodeBoard, {name.split(" ")[0]}! 🎉</h1>
          <p className="text-xl text-neutral-600 mb-8">
            You're now on our exclusive early access list with <strong>free researcher privileges</strong>.
          </p>
        </div>

        <Card className="border-neutral-200 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span className="text-neutral-700">Researcher account reserved at {email}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span className="text-neutral-700">Free access to premium features ($99/month value)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span className="text-neutral-700">Priority beta access when we launch</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span className="text-neutral-700">Direct line to our development team</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-neutral-900">What happens next?</h3>
          <div className="text-neutral-600 space-y-2">
            <p>📧 You'll receive a confirmation email shortly</p>
            <p>🚀 We'll notify you as soon as beta access opens</p>
            <p>💬 Follow us on social media for development updates</p>
          </div>
          
          <div className="pt-4 border-t border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-3">Ready to contribute right now?</h4>
            <p className="text-neutral-600 text-sm mb-4">
              Help us build the corpus by sharing your code-switching examples today!
            </p>
            <Button asChild className="bg-teal-600 hover:bg-teal-700 w-full">
              <Link href="/contribute">
                Start Contributing Examples
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex items-center justify-center space-x-2 text-neutral-500">
            <div className="bg-teal-600 p-1 rounded">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">CodeBoard - Revolutionizing Code-Switching Research</span>
          </div>
        </div>
      </div>
    </div>
  )
}
