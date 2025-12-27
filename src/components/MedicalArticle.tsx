import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock, Tag } from "lucide-react";
import { useState } from "react";

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  tags: string[];
  summary: string;
  content: {
    overview: string;
    symptoms?: string[];
    causes?: string[];
    treatment?: string[];
    prevention?: string[];
    whenToSeek?: string;
  };
}

interface MedicalArticleProps {
  article: Article;
}

export const MedicalArticle = ({ article }: MedicalArticleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{article.category}</Badge>
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-xl">{article.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                {article.readTime} read
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <button className="p-2 hover:bg-accent rounded-full transition-colors">
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
          </div>
          <p className="text-muted-foreground mt-2">{article.summary}</p>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Overview */}
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Overview</h3>
              <p className="text-muted-foreground leading-relaxed">{article.content.overview}</p>
            </div>

            {/* Symptoms */}
            {article.content.symptoms && article.content.symptoms.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Common Symptoms</h3>
                <ul className="space-y-2">
                  {article.content.symptoms.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Causes */}
            {article.content.causes && article.content.causes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Common Causes</h3>
                <ul className="space-y-2">
                  {article.content.causes.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Treatment */}
            {article.content.treatment && article.content.treatment.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Treatment Options</h3>
                <ul className="space-y-2">
                  {article.content.treatment.map((treatment, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prevention */}
            {article.content.prevention && article.content.prevention.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Prevention Tips</h3>
                <ul className="space-y-2">
                  {article.content.prevention.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to Seek Medical Care */}
            {article.content.whenToSeek && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 text-destructive flex items-center gap-2">
                  <span>⚠️</span> When to Seek Medical Care
                </h3>
                <p className="text-muted-foreground leading-relaxed">{article.content.whenToSeek}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
