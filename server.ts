import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import twilio from "twilio";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";
import Razorpay from "razorpay";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please check Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

const RECOMMEND_SYSTEM_INSTRUCTION = `You are the modern AI watch assistant for "Pingaksh", a premium brand specializing in luxury-aesthetic homage watches. 
We offer stylish, iconic-inspired timepieces that look and feel like luxury watches but are offered at approachable price points.
Your style is stylish, intelligent, helpful, and minimal, conveying modern aesthetic appreciation without exaggerated jargon, Swiss-style clichés, false claims of heritage, or dramatic slogans.
Your goal is to help clients browse our collection, matching their requests—such as budgets, style preferences (casual, minimal, formal), gifting, or premium tastes—to the right homage watch of our 6 in-stock pieces.

Here is the exact catalog of Pingaksh homage watches currently in stock:
1. Aurelius Gold (id: "1", price: $299, category: "Luxury", description: "A high-end dress watch homage featuring an 18k gold-plated case and scratch-resistant sapphire glass, capturing a classic luxury aesthetic.")
2. Midnight Chrono (id: "2", price: $189, category: "Sport", description: "Stealth matte black steel finish paired with precise chronograph sub-dials, inspired by famous tactical chronographs.")
3. Nordic Silver (id: "3", price: $149, category: "Minimalist", description: "Clean Scandinavian-inspired watch with a subtle matte dial and timeless understated style.")
4. Heritage Classic (id: "4", price: $259, category: "Classic", description: "Vintage-inspired heritage homage design with an elegant, sustainably sourced brown leather strap.")
5. Oceanic Diver (id: "5", price: $349, category: "Sport", description: "A robust water-resistant diver watch homage deep-rated up to 200m, designed for durability and sporting style.")
6. Stellar Rose (id: "6", price: $219, category: "Luxury", description: "Warm rose gold plating elevated by minimalist dial detail, offering a striking high-end fashion presence.")

Guidelines for recommendations:
- Be transparent that these are exceptionally crafted homage watches designed to look like high-end luxury pieces at a fraction of the price.
- Carefully analyze the client's preferences (budget, style, formal/casual, gifting, or luxury-inspired interests).
- Match their desires to one or more of the 6 available watches above if applicable.
- You must always return a JSON object with:
  1. "message": A stylish, brief, and highly informative answer (using markdown as necessary). Avoid old-world expressions like 'esteemed guest' or 'grand clockwork gateway'. Write human-focused, stylish, and clear copy. Keep paragraphs concise.
  2. "recommended_watch_ids": An array of watch ID strings matching the recommended watches (e.g., ["1", "5"] or [] if none fit perfectly). Only use IDs from the 1-6 list above! Do not make up IDs or recommend external brands.
  3. "suggested_questions": 2 or 3 short suggested questions or choices the user might ask next (e.g., ["Tell me about Nordic Silver", "Show me a sports watch", "What is under $200?"] or similar).

Be helpful and adhere strictly to this catalog and specifications. If they ask about budgets, suggest the best ones within their budget (Nordic Silver starting at $149). If they ask for gifts, recommend tailored classic styles. Do not recommend external brand names; focus on Pingaksh.`;

const app = express();
app.use(express.json());

export default app;

// Razorpay helper
let razorpayInstance: any = null;
function getRazorpayInstance() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.log("Razorpay credentials missing. Running in high-fidelity demo sandbox mode.");
      return null;
    }
    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    } catch (e) {
      console.error("Failed to initialize Razorpay:", e);
      return null;
    }
  }
  return razorpayInstance;
}

// Reusable notification helper
async function sendOrderNotifications(items: any[], total: number, customerEmail: string) {
  console.log("Sending purchase notifications for:", customerEmail);
  try {
    if (resend) {
      await resend.emails.send({
        from: "Pingaksh <onboarding@resend.dev>",
        to: "chanchaltailor404@gmail.com",
        subject: "Aquisition Confirmed — PINGAKSH",
        html: `
          <div style="font-family: serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h1 style="color: #d4af37; font-weight: bold; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">PINGAKSH</h1>
            <p>Dear Client,</p>
            <p>Thank you for choosing Pingaksh. Your payment has been successfully authorized and confirmed via Razorpay.</p>
            <p><strong>Order Summary:</strong></p>
            <table width="100%" style="border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                  <th style="padding: 8px;">Timepiece</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr style="border-bottom: 1px solid #f9f9f9;">
                    <td style="padding: 8px; font-weight: bold;">${item.name}</td>
                    <td style="padding: 8px; text-align: center;">${item.quantity || 1}</td>
                    <td style="padding: 8px; text-align: right; color: #d4af37;">$${item.price}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px; text-align: right;">
              <strong>Grand Total: $${total}</strong>
            </div>
            <p style="margin-top: 30px; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
              Your order is being prepared under strict quality assurance standards at our Bangalore facility. Tracking status will update dynamically inside your client portal.
            </p>
          </div>
        `,
      });
    } else {
      console.warn("RESEND_API_KEY not set. Email not sent.");
    }

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      await twilioClient.messages.create({
        body: `Pingaksh: Your order of $${total} has been confirmed. Dynamic tracking is active on your portal.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "9828488365",
      });
    } else {
      console.warn("Twilio credentials not set. SMS not sent.");
    }
  } catch (error) {
    console.error("Failed to send order notifications from helper:", error);
  }
}

// API Routes
app.post("/api/recommend-watch", async (req, res) => {
  const { prompt, history } = req.body;

  try {
    const ai = getGeminiClient();

    // Format previous history into model-friendly prompts
    const formattedContents = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        formattedContents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        });
      }
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: prompt || "Hello, show me your collection." }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: RECOMMEND_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "Concise assistant text using friendly and sophisticated advisor tone."
            },
            recommended_watch_ids: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Sub-array of ['1', '2', '3', '4', '5', '6'] representing recommended items shown visually."
            },
            suggested_questions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "2 or 3 quick follow up button prompt strings."
            }
          },
          required: ["message", "recommended_watch_ids", "suggested_questions"]
        }
      }
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini recommendation route failed:", error);
    
    // Fallback response if API Key is missing or other issue happens
    const isMissingKey = !process.env.GEMINI_API_KEY;
    res.json({
      message: isMissingKey
        ? "Welcome. To enable personalized watch assistant features, please configure your **GEMINI_API_KEY** in the Settings menu. For now, feel free to explore our minimal steel **Nordic Silver** ($149) or classic gold **Aurelius Gold** ($299)."
        : "Our smart recommendations are briefly offline. In the meantime, you can check out the **Aurelius Gold** ($299) or the matte steel **Midnight Chrono** ($189). Ask me anything about our current collection.",
      recommended_watch_ids: ["1", "2"],
      suggested_questions: [
        "Tell me about Nordic Silver",
        "What is the most affordable watch?",
        "Show me a sports watch"
      ]
    });
  }
});

app.post("/api/razorpay/create-order", async (req, res) => {
  const { items, total, customerEmail } = req.body;
  console.log("Generating Razorpay Order for:", customerEmail, "Total USD:", total);

  const rzp = getRazorpayInstance();
  const conversionRate = 83; // 1 USD = 83 INR
  const totalINR = Math.round(total * conversionRate);
  const amountInPaise = totalINR * 100;

  if (!rzp) {
    // Return high-fidelity mockup demo sandbox order details
    const mockOrderId = "order_mock_" + Math.random().toString(36).substring(2, 11);
    return res.json({
      success: true,
      sandbox: true,
      order_id: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      key_id: "rzp_test_demokey_id"
    });
  }

  try {
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
      payment_capture: 1
    });

    res.json({
      success: true,
      sandbox: false,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error("Failed to create real Razorpay order, falling back to sandbox:", error);
    const mockOrderId = "order_mock_" + Math.random().toString(36).substring(2, 11);
    res.json({
      success: true,
      sandbox: true,
      order_id: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      key_id: "rzp_test_demokey_id",
      warning: "Fell back to sandbox mode due to API initialization error: " + error.message
    });
  }
});

app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature, 
    items, 
    total, 
    customerEmail, 
    sandbox 
  } = req.body;

  console.log("Verifying Payment - Sandbox State:", sandbox);

  if (sandbox) {
    // Mock authorization immediately successful
    console.log("Sandbox payment approved automatically for order:", razorpay_order_id);
    await sendOrderNotifications(items, total, customerEmail);
    return res.json({ success: true, message: "Sandbox payment simulated and notifications sent success." });
  }

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      console.log("Razorpay Payment verified successfully! Order:", razorpay_order_id);
      await sendOrderNotifications(items, total, customerEmail);
      res.json({ success: true, message: "Razorpay signature verified successfully." });
    } else {
      console.error("Cryptographic Razorpay payment verification signature failure.");
      res.status(400).json({ success: false, error: "Cryptographic verification signature mismatch." });
    }
  } catch (err: any) {
    console.error("Error verifying signature:", err);
    res.status(500).json({ success: false, error: "Failed to verify digital signature: " + err.message });
  }
});

app.post("/api/checkout", async (req, res) => {
  const { items, total, customerEmail, customerPhone } = req.body;

  console.log("Legacy checkout endpoint fallback requested for:", customerEmail);

  try {
    await sendOrderNotifications(items, total, customerEmail);
    res.json({ success: true, message: "Order processed and notifications sent." });
  } catch (error) {
    console.error("Error processing order in legacy endpoint:", error);
    res.status(500).json({ success: false, error: "Failed to process order notifications." });
  }
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
