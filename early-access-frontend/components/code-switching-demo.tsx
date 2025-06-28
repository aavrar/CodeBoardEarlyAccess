"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Play, Lightbulb, Zap } from "lucide-react"

interface LanguageToken {
  word: string
  language: string
  confidence: number
  isSwitch: boolean
}

const demoExamples = [
  {
    text: "I'm going to la tienda to buy some groceries",
    languages: ["English", "Spanish"],
    description: "Common English-Spanish switch in daily conversation"
  },
  {
    text: "मैं today बहुत busy हूं with work",
    languages: ["Hindi", "English"],
    description: "Hindi-English code-switching in modern context"
  },
  {
    text: "我想要 some coffee من فضلك",
    languages: ["Chinese", "English", "Arabic"],
    description: "Trilingual ordering scenario with multiple scripts"
  },
  {
    text: "J'ai un meeting très important, can you help me prepare?",
    languages: ["French", "English"],
    description: "Professional French-English code-switching"
  },
]

export function CodeSwitchingDemo() {
  const [inputText, setInputText] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<LanguageToken[] | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)

  const availableLanguages = [
    "English", "Spanish", "Hindi", "Chinese", "French", "Arabic",
    "Portuguese", "Russian", "Japanese", "German", "Korean", "Italian",
    "Dutch", "Swedish", "Norwegian", "Tagalog", "Urdu", "Bengali"
  ]

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const simulateAnalysis = async (text: string, languages: string[]) => {
    setIsAnalyzing(true)
    setAnalysis(null)
    setConfidence(null)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock analysis based on common patterns
    const words = text.split(' ')
    const mockTokens: LanguageToken[] = words.map((word, index) => {
      let language = languages[0] || "English"
      let confidence = 0.85
      let isSwitch = false

      // Simple heuristics for demo purposes
      if (word.toLowerCase().includes('la') || word.toLowerCase().includes('el') || word.toLowerCase().includes('muy')) {
        language = "Spanish"
        confidence = 0.92
        isSwitch = true
      } else if (word.toLowerCase().includes('très') || word.toLowerCase().includes('le') || word.toLowerCase().includes('une')) {
        language = "French"
        confidence = 0.89
        isSwitch = true
      } else if (/[\u0900-\u097F]/.test(word)) {
        language = "Hindi"
        confidence = 0.94
        isSwitch = true
      } else if (/[\u0600-\u06FF]/.test(word)) {
        language = "Arabic"
        confidence = 0.91
        isSwitch = true
      } else if (/[\u4e00-\u9fff]/.test(word)) {
        language = "Chinese"
        confidence = 0.88
        isSwitch = true
      }

      return { word, language, confidence, isSwitch }
    })

    setAnalysis(mockTokens)
    setConfidence(0.87)
    setIsAnalyzing(false)
  }

  const handleAnalyze = () => {
    if (inputText.trim() && selectedLanguages.length > 0) {
      simulateAnalysis(inputText, selectedLanguages)
    }
  }

  const loadExample = (example: typeof demoExamples[0]) => {
    setInputText(example.text)
    setSelectedLanguages(example.languages)
    setAnalysis(null)
    setConfidence(null)
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      "English": "bg-blue-100 text-blue-800 border-blue-200",
      "Spanish": "bg-orange-100 text-orange-800 border-orange-200", 
      "French": "bg-purple-100 text-purple-800 border-purple-200",
      "German": "bg-gray-100 text-gray-800 border-gray-200",
      "Hindi": "bg-pink-100 text-pink-800 border-pink-200",
      "Arabic": "bg-green-100 text-green-800 border-green-200",
      "Chinese": "bg-red-100 text-red-800 border-red-200"
    }
    return colors[language] || "bg-neutral-100 text-neutral-800 border-neutral-200"
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-teal-600 p-3 rounded-full mr-3">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              Try Our AI-Powered Analysis
            </h2>
          </div>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Experience the magic of code-switching detection. Enter your own text or try our examples to see how our AI identifies language switches in real-time.
          </p>
        </div>

        <Card className="border-neutral-200 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-teal-600" />
              Interactive Demo
            </CardTitle>
            <CardDescription>
              Enter text with multiple languages and see our AI analyze the code-switching patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Example Buttons */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Try these examples:</Label>
              <div className="grid gap-3">
                {demoExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left h-auto p-4 flex flex-col items-start gap-1"
                    onClick={() => loadExample(example)}
                  >
                    <span className="font-medium">{example.text}</span>
                    <span className="text-xs text-neutral-500">{example.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="demo-text">Your Text</Label>
              <Textarea
                id="demo-text"
                placeholder="Enter text with multiple languages..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Languages Present</Label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((language) => (
                  <Badge
                    key={language}
                    variant={selectedLanguages.includes(language) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedLanguages.includes(language) 
                        ? "bg-teal-600 hover:bg-teal-700" 
                        : "hover:bg-teal-50"
                    }`}
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!inputText.trim() || selectedLanguages.length === 0 || isAnalyzing}
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze Code-Switching
                </>
              )}
            </Button>

            {/* Results */}
            {analysis && (
              <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-neutral-900">Analysis Results</h4>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {confidence && `${Math.round(confidence * 100)}% confidence`}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {analysis.map((token, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getLanguageColor(token.language)} ${
                        token.isSwitch ? 'ring-2 ring-teal-300' : ''
                      }`}
                      title={`${token.language} (${Math.round(token.confidence * 100)}% confidence)`}
                    >
                      {token.word}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-neutral-600">
                  <strong>Switch points detected:</strong> {analysis.filter(t => t.isSwitch).length} language switches
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-teal-900 mb-2">
                Ready to Contribute Your Own Examples?
              </h3>
              <p className="text-teal-700 mb-4">
                Join thousands of researchers building the world's most comprehensive code-switching corpus
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <a href="#signup">Get Early Access</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}