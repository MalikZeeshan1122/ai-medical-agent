import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiTemplates, templateCategories, APITemplate } from "@/data/apiTemplates";
import { Search, BookTemplate, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface APITemplateSelectorProps {
  onSelectTemplate: (template: APITemplate) => void;
}

export const APITemplateSelector = ({ onSelectTemplate }: APITemplateSelectorProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredTemplates = apiTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                         template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookTemplate className="w-4 h-4 mr-2" />
          Browse Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>API Integration Templates</DialogTitle>
          <DialogDescription>
            Quick-start templates for popular APIs - just add your API key
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="All">All</TabsTrigger>
              {templateCategories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-3 mt-4">
              {filteredTemplates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No templates found matching your search
                </p>
              ) : (
                filteredTemplates.map(template => (
                  <Card key={template.name} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.name}
                            <Badge variant="secondary">{template.category}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onSelectTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Base URL:</span>{" "}
                          <code className="bg-muted px-1 py-0.5 rounded">{template.baseUrl}</code>
                        </p>
                        {template.requiresApiKey && (
                          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-600" />
                            <p className="text-amber-700 dark:text-amber-400 text-xs">
                              {template.setupInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
