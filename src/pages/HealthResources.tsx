import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalArticle } from "@/components/MedicalArticle";
import { medicalArticles, categories } from "@/data/medicalArticles";

const HealthResources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredArticles = useMemo(() => {
    return medicalArticles.filter((article) => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === "All Categories" || 
        article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Medical Knowledge Base
        </h1>
        <p className="text-muted-foreground">
          Comprehensive, evidence-based articles about common health conditions, symptoms, and treatments
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Articles</CardTitle>
          <CardDescription>Find information about specific conditions or symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by condition, symptom, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by category:</span>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== "All Categories" && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <MedicalArticle key={article.id} article={article} />
          ))
        ) : (
          <Card className="p-12 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-muted-foreground">No articles found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Disclaimer */}
      <Card className="bg-accent/30 border-accent">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Medical Disclaimer:</strong> The information provided in this knowledge base is for educational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read here. If you think you may have a medical emergency, call your doctor or emergency services immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthResources;
