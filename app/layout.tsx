import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./received.css";
import "./detail.css";
import "./reset.css";
import "./recognition.css";
const geist=Geist({variable:"--font-geist",subsets:["latin"]});
export const metadata:Metadata={title:"Offertekamer · Samen beslissen",description:"Ontvangen offertes, besluiten, categorieën en taken in één gezamenlijk bedrijfsoverzicht."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl"><body className={geist.variable}>{children}</body></html>}

