"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AppNavbar } from "@/components/app-navbar"
import { useAuth } from "@/components/auth-provider"
import { 
  Globe, 
  Plus, 
  Send, 
  CheckCircle,
  Users,
  BarChart3,
  Lightbulb,
  Target
} from "lucide-react"

export default function ContributePage() {
  const [formData, setFormData] = useState({
    text: "",
    languages: [] as string[],
    context: "",
    region: "",
    platform: "",
    age: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalExamples: 15000,
    contributors: 2500,
    languagePairs: 35,
    isReal: false,
    goalDescription: "Target metrics for full platform launch"
  })
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch real-time stats from main backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/dashboard/metrics`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setStats({
            totalExamples: data.data.totalExamples,
            contributors: data.data.contributors,
            languagePairs: data.data.languagePairs,
            isReal: data.data.isReal || false,
            goalDescription: data.data.goalDescription || "",
            currentProgress: data.data.currentProgress
          })
        }
      } catch (error) {
        console.log('Using fallback stats')
        // Keep default stats on error
      }
    }

    fetchStats()
  }, [])

  const availableLanguages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Hindi", "Arabic", "Chinese", "Japanese", "Korean", "Dutch", "Russian"
  ]

  const contextOptions = [
    "Casual conversation", "Social media", "Professional", "Academic", 
    "Family", "Friends", "Online gaming", "Shopping", "Travel", "Other"
  ]

  const platformOptions = [
    "WhatsApp", "Instagram", "Twitter/X", "Facebook", "TikTok", 
    "Discord", "SMS", "Email", "In-person", "Other"
  ]

  const regionOptions = [
    "North America", "South America", "Europe", "Asia", "Africa", 
    "Australia/Oceania", "Caribbean", "Middle East"
  ]

  const ageOptions = [
    "Under 18", "18-25", "26-35", "36-45", "46-55", "56-65", "Over 65"
  ]

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter your code-switching example.",
        variant: "destructive"
      })
      return
    }

    if (formData.languages.length < 2) {
      toast({
        title: "Multiple languages required",
        description: "Please select at least 2 languages present in your example.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Include user information if available
      const submissionData = {
        ...formData,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name
      }

      // Use the main CodeBoard backend API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/examples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('codeboardToken')}` }),
        },
        body: JSON.stringify(submissionData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Contribution submitted! 🎉",
          description: "Thank you for helping build the world's largest code-switching corpus.",
        })

        // Reset form
        setFormData({
          text: "",
          languages: [],
          context: "",
          region: "",
          platform: "",
          age: ""
        })
      } else {
        toast({
          title: "Submission failed",
          description: data.message || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-neutral-50">
      {/* Navigation */}
      <AppNavbar />

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
            Contribute to the <span className="text-teal-600">Future</span> of Research
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Share your code-switching examples and help researchers worldwide understand multilingual communication better.
          </p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-teal-200 bg-teal-50 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-teal-900 mb-2">{stats.totalExamples.toLocaleString()}</div>
                <div className="text-teal-700">{stats.isReal ? 'Examples contributed' : 'Target examples'}</div>
                {!stats.isReal && stats.currentProgress && (
                  <div className="text-xs text-teal-600 mt-1">Current: {stats.currentProgress.examples}</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-900 mb-2">{stats.contributors.toLocaleString()}</div>
                <div className="text-amber-700">{stats.isReal ? 'Contributors' : 'Target community size'}</div>
                {!stats.isReal && stats.currentProgress && (
                  <div className="text-xs text-amber-600 mt-1">Current: {stats.currentProgress.users} early access users</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-emerald-900 mb-2">{stats.languagePairs}</div>
                <div className="text-emerald-700">{stats.isReal ? 'Language pairs covered' : 'Target language pairs'}</div>
              </CardContent>
            </Card>
          </div>
          {!stats.isReal && stats.goalDescription && (
            <div className="text-center mb-8">
              <p className="text-sm text-neutral-600 bg-neutral-100 inline-block px-4 py-2 rounded-full">
                {stats.goalDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contribution Form */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-neutral-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                Submit Your Code-Switching Example
              </CardTitle>
              <CardDescription>
                Help researchers by sharing real examples of how you naturally switch between languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="text">Your Code-Switching Example *</Label>
                  <Textarea
                    id="text"
                    placeholder="e.g., 'I'm going to la tienda to buy some groceries porque we need milk'"
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    className="min-h-[120px]"
                    required
                  />
                  <p className="text-sm text-neutral-500">
                    Share a natural example where you switch between languages
                  </p>
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <Label>Languages Present in Your Example *</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableLanguages.map((language) => (
                      <Badge
                        key={language}
                        variant={formData.languages.includes(language) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.languages.includes(language) 
                            ? "bg-teal-600 hover:bg-teal-700" 
                            : "hover:bg-teal-50"
                        }`}
                        onClick={() => handleLanguageToggle(language)}
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-neutral-500">
                    Select all languages present in your example (minimum 2)
                  </p>
                </div>

                {/* Context */}
                <div className="space-y-2">
                  <Label htmlFor="context">Context</Label>
                  <Select value={formData.context} onValueChange={(value) => setFormData(prev => ({ ...prev, context: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where does this type of switching happen?" />
                    </SelectTrigger>
                    <SelectContent>
                      {contextOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform/Medium</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where was this said/written?" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region and Age */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age Group</Label>
                    <Select value={formData.age} onValueChange={(value) => setFormData(prev => ({ ...prev, age: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Your age group" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Contribute to Research
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Contribute Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Why Your Contribution Matters</h2>
            <p className="text-xl text-neutral-600">
              Every example you share helps advance our understanding of multilingual communication
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-neutral-200">
              <CardHeader>
                <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-neutral-900">Research Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Your examples directly support linguistic research and help develop better language technologies.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-neutral-900">Community Building</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Join a global community of multilingual speakers contributing to scientific knowledge.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-neutral-900">Representation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm">
                  Ensure your language community and switching patterns are represented in research.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}