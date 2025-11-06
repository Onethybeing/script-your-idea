import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  preview_image_url: string | null;
  price: number;
  rating: number;
  downloads: number;
}

export const Marketplace = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("is_published", true)
      .order("downloads", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading marketplace:", error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Marketplace
        </h3>
        <p className="text-sm text-muted-foreground">
          Explore AI presets and styles
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-panel">
                <CardHeader className="p-4">
                  <Skeleton className="h-32 w-full rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id} className="glass-panel hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="p-4">
                {product.preview_image_url && (
                  <img
                    src={product.preview_image_url}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{product.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{product.downloads}</span>
                  </div>
                  <div className="font-semibold">
                    {product.price > 0 ? `$${product.price}` : "Free"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-panel">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No products available yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
