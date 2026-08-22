export async function POST(request: Request) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return Response.json({ error: "Documentherkenning is nog niet ingesteld." }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Kies eerst een offertebestand." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Het bestand is groter dan 10 MB." }, { status: 400 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}`;
    const documentInput = file.type.startsWith("image/")
      ? { type: "input_image", image_url: dataUrl, detail: "high" }
      : { type: "input_file", file_data: dataUrl, filename: file.name };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.2",
        store: false,
        instructions: "Lees de ontvangen offerte zorgvuldig. Neem alleen gegevens over die in het document staan. Herken het eindtotaal exclusief btw en het eindtotaal inclusief btw afzonderlijk; bereken of raad ontbrekende bedragen niet. Zet ontbrekende gegevens op null. Vat het onderwerp kort en zakelijk samen. Controleer het document nogmaals voordat je antwoordt.",
        input: [{ role: "user", content: [{ type: "input_text", text: "Herken leverancier, totaal exclusief btw, totaal inclusief btw, project/onderwerp, korte toelichting en alle afzonderlijke producten of diensten met hun prijs exclusief btw." }, documentInput] }],
        text: { format: { type: "json_schema", name: "offertegegevens", strict: true, schema: { type: "object", additionalProperties: false, properties: { supplier: { type: ["string", "null"] }, amount_excl_vat: { type: ["number", "null"] }, amount_incl_vat: { type: ["number", "null"] }, project: { type: ["string", "null"] }, description: { type: ["string", "null"] }, line_items: { type:"array", items:{type:"object",additionalProperties:false,properties:{description:{type:"string"},details:{type:["string","null"]},amount_excl_vat:{type:"number"}},required:["description","details","amount_excl_vat"]} } }, required: ["supplier", "amount_excl_vat", "amount_incl_vat", "project", "description", "line_items"] } } }
      })
    });
    const result = await response.json();
    if (!response.ok) return Response.json({ error: result?.error?.message || "De offerte kon niet worden gelezen." }, { status: response.status });
    const outputText = result.output_text || result.output?.flatMap((item: {content?: Array<{type?:string;text?:string}>}) => item.content || []).find((item: {type?:string}) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("Geen herkenbare offertegegevens gevonden.");
    return Response.json(JSON.parse(outputText));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "De offerte kon niet worden gelezen." }, { status: 500 });
  }
}

