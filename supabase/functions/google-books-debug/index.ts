import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const envVars = {
    GOOGLE_BOOKS_KEY: Deno.env.get('GOOGLE_BOOKS_KEY') ? 'SET (length: ' + Deno.env.get('GOOGLE_BOOKS_KEY')!.length + ')' : 'NOT SET',
    GOOGLE_BOOKS_API_KEY: Deno.env.get('GOOGLE_BOOKS_API_KEY') ? 'SET' : 'NOT SET',
    allEnvKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('GOOGLE') || k.includes('API')),
  };

  return new Response(
    JSON.stringify(envVars, null, 2),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});