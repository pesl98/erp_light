import { GoogleGenAI, Type } from "@google/genai";
import { Product, Supplier, PurchaseRequisition, PRStatus, POItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to sanitize JSON strings from LLM responses
const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned;
};

export const generateMockInventory = async (): Promise<{ products: Product[], suppliers: Supplier[] }> => {
  if (!apiKey) {
    console.warn("No API Key, returning static mock data fallback.");
    return { products: [], suppliers: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a realistic inventory dataset for a high-end electronics and accessories store. Create 5 suppliers and 15 products distributed among them. Ensure stock levels vary (some low, some high).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suppliers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  contactEmail: { type: Type.STRING },
                  leadTimeDays: { type: Type.NUMBER }
                }
              }
            },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  stockLevel: { type: Type.NUMBER },
                  reorderPoint: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  supplierName: { type: Type.STRING, description: "Must match one of the generated supplier names" }
                }
              }
            }
          }
        }
      }
    });

    const text = cleanJsonString(response.text || "{}");
    const data = JSON.parse(text);
    
    // Transform to our internal types with IDs
    const suppliers: Supplier[] = (data.suppliers || []).map((s: any) => ({
      ...s,
      id: generateId()
    }));

    const products: Product[] = (data.products || []).map((p: any) => {
      const supplier = suppliers.find(s => s.name === p.supplierName) || suppliers[0];
      return {
        id: generateId(),
        sku: p.sku,
        name: p.name,
        category: p.category,
        stockLevel: p.stockLevel,
        reorderPoint: p.reorderPoint,
        unitPrice: p.unitPrice,
        supplierId: supplier?.id || 'unknown',
        lastUpdated: new Date().toISOString(),
        status: 'ACTIVE'
      };
    });

    return { products, suppliers };

  } catch (error) {
    console.error("Failed to generate mock data", error);
    return { products: [], suppliers: [] };
  }
};

export const analyzeStockAndSuggestPR = async (products: Product[], suppliers: Supplier[]): Promise<{
    summary: string,
    requisitions: PurchaseRequisition[]
}> => {
    
    // Optimization: Only send relevant items to the LLM
    const relevantProducts = products.filter(p => p.stockLevel <= (p.reorderPoint * 2));
    const healthyCount = products.length - relevantProducts.length;

    if (relevantProducts.length === 0 && products.length > 0) {
        return {
            summary: `Inventory is in excellent health. All ${products.length} items are well above reorder points. No immediate action required.`,
            requisitions: []
        };
    }

    // Prepare context for Gemini
    const inventoryContext = JSON.stringify(relevantProducts.map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.stockLevel,
        reorderPoint: p.reorderPoint,
        supplierId: p.supplierId
    })));

    const supplierContext = JSON.stringify(suppliers.map(s => ({
        id: s.id,
        name: s.name
    })));

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this inventory data (subset of items needing attention). 
            Note: ${healthyCount} other items are healthy and excluded from this list.
            Identify items below or near reorder points. 
            Create Purchase Requisitions (PRs) to replenish stock.
            Group items into logical requisitions (usually by existing supplier relationship).
            Provide a short executive summary of the inventory health.
            
            Inventory Context: ${inventoryContext}
            Suppliers: ${supplierContext}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A brief 2-3 sentence analysis of stock health." },
                        requisitions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    suggestedSupplierId: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    items: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                productId: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const text = cleanJsonString(response.text || "{}");
        const result = JSON.parse(text);
        
        const requisitions: PurchaseRequisition[] = (result.requisitions || []).map((req: any) => {
             const items: POItem[] = req.items.map((item: any) => {
                 const prod = products.find(p => p.id === item.productId);
                 return {
                     productId: item.productId,
                     quantity: item.quantity,
                     unitPrice: prod ? prod.unitPrice : 0
                 };
             });

             return {
                 id: generateId(),
                 reqNumber: `PR-${Math.floor(Math.random() * 10000)}`,
                 suggestedSupplierId: req.suggestedSupplierId,
                 status: PRStatus.PENDING,
                 dateCreated: new Date().toISOString(),
                 reason: req.reason || 'Auto-replenishment',
                 items
             };
        });

        return {
            summary: result.summary || "Analysis complete.",
            requisitions
        };

    } catch (e) {
        console.error("Error analyzing stock", e);
        throw e;
    }
}