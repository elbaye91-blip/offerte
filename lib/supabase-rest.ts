const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export type Session={access_token:string;refresh_token:string;user:{id:string;email:string}};
const headers=(token?:string)=>({apikey:key,Authorization:`Bearer ${token||key}`});

export async function signIn(email:string,password:string){
  const r=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  if(!r.ok) throw new Error("E-mailadres of wachtwoord klopt niet.");
  return await r.json() as Session;
}
export async function setPassword(accessToken:string,password:string){
  const r=await fetch(`${url}/auth/v1/user`,{method:"PUT",headers:{...headers(accessToken),"Content-Type":"application/json"},body:JSON.stringify({password})});
  if(!r.ok) throw new Error("Het wachtwoord kon niet worden ingesteld. Vraag een nieuwe herstelmail aan.");
  return r.json();
}
export async function requestPasswordReset(email:string,redirectTo:string){
  const r=await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:"POST",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify({email})});
  if(r.status===429) throw new Error("Er zijn te veel herstelmails aangevraagd. Wacht ongeveer een uur en probeer het daarna één keer opnieuw.");
  if(!r.ok) throw new Error("De herstelmail kon niet worden verstuurd.");
}
export async function getProfiles(token:string){
  const r=await fetch(`${url}/rest/v1/profiles?select=id,full_name,role,avatar_url&actief=eq.true`,{headers:headers(token)});
  if(!r.ok) throw new Error("Gebruikers konden niet worden geladen."); return r.json();
}
export async function getQuotes(token:string){
  const r=await fetch(`${url}/rest/v1/app_quotes?select=*&order=created_at.desc`,{headers:headers(token),cache:"no-store"});
  if(!r.ok) throw new Error("Offertes konden niet worden geladen."); return r.json();
}
export async function getQuoteCategories(token:string){
  const r=await fetch(`${url}/rest/v1/app_quote_categories?select=id,name&order=name.asc`,{headers:headers(token),cache:"no-store"});
  if(!r.ok) throw new Error("Categorieën konden niet worden geladen."); return r.json();
}
export async function createQuoteCategory(token:string,userId:string,name:string){
  const r=await fetch(`${url}/rest/v1/app_quote_categories`,{method:"POST",headers:{...headers(token),"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({name:name.trim(),created_by:userId})});
  if(!r.ok) throw new Error(r.status===409?"Deze categorie bestaat al.":"Categorie toevoegen is niet gelukt.");
  const rows=await r.json(); return rows[0] as {id:string;name:string};
}
export async function getDecisions(token:string){
  const r=await fetch(`${url}/rest/v1/app_quote_decisions?select=*&order=updated_at.desc`,{headers:headers(token),cache:"no-store"});
  if(!r.ok) throw new Error("Besluiten konden niet worden geladen."); return r.json();
}
export async function getTasks(token:string){
  const r=await fetch(`${url}/rest/v1/app_tasks?select=*&order=created_at.desc`,{headers:headers(token),cache:"no-store"});
  if(!r.ok) throw new Error("Taken konden niet worden geladen."); return r.json();
}
export async function createTask(token:string,data:Record<string,unknown>){
  const r=await fetch(`${url}/rest/v1/app_tasks`,{method:"POST",headers:{...headers(token),"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(data)});
  if(!r.ok) throw new Error("Taak toevoegen is niet gelukt."); return r.json();
}
export async function updateTaskStatus(token:string,id:string,data:Record<string,unknown>){
  const r=await fetch(`${url}/rest/v1/app_tasks?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{...headers(token),"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(data)});
  if(!r.ok) throw new Error("Taakstatus wijzigen is niet gelukt."); return r.json();
}
export async function deleteTask(token:string,id:string){
  const r=await fetch(`${url}/rest/v1/app_tasks?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{...headers(token),Prefer:"return=minimal"}});
  if(!r.ok) throw new Error("Taak verwijderen is niet gelukt.");
}
export async function saveDecision(token:string,data:Record<string,unknown>){
  const r=await fetch(`${url}/rest/v1/app_quote_decisions?on_conflict=quote_id,user_id`,{method:"POST",headers:{...headers(token),"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(data)});
  if(!r.ok) throw new Error("Jouw keuze kon niet worden opgeslagen."); return r.json();
}
export async function uploadDocument(token:string,userId:string,file:File){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-"); const path=`${userId}/${crypto.randomUUID()}-${safe}`;
  const r=await fetch(`${url}/storage/v1/object/offerte-documenten/${path}`,{method:"POST",headers:{...headers(token),"Content-Type":file.type,"x-upsert":"false"},body:file});
  if(!r.ok) throw new Error("Uploaden is niet gelukt."); return path;
}
export async function createQuote(token:string,data:Record<string,unknown>){
  const r=await fetch(`${url}/rest/v1/app_quotes`,{method:"POST",headers:{...headers(token),"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(data)});
  if(!r.ok) throw new Error("Offerte opslaan is niet gelukt."); return r.json();
}
export async function updateQuote(token:string,id:string,data:Record<string,unknown>){
  const r=await fetch(`${url}/rest/v1/app_quotes?id=eq.${id}`,{method:"PATCH",headers:{...headers(token),"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(data)});
  if(!r.ok) throw new Error("Besluit opslaan is niet gelukt."); return r.json();
}
export async function deleteQuote(token:string,id:string,documentPath:string|null){
  if(documentPath){await fetch(`${url}/storage/v1/object/offerte-documenten/${documentPath}`,{method:"DELETE",headers:headers(token)});}
  const r=await fetch(`${url}/rest/v1/app_quotes?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{...headers(token),Prefer:"return=minimal"}});
  if(!r.ok) throw new Error("De offerte kon niet worden verwijderd.");
}
export async function signedDocumentUrl(token:string,path:string){
  const r=await fetch(`${url}/storage/v1/object/sign/offerte-documenten/${path}`,{method:"POST",headers:{...headers(token),"Content-Type":"application/json"},body:JSON.stringify({expiresIn:300})});
  if(!r.ok) throw new Error("Document kon niet worden geopend."); const d=await r.json(); return `${url}/storage/v1${d.signedURL}`;
}

