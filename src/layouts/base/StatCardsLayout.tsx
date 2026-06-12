/**
 * StatCardsLayout — centered stat-card screen with icon hero and callout.
 * Also exports ManifestStatCardsLayout for the governance/leadership variant.
 *
 * Layout ID: "stat-cards"
 * Extracted from genai_advocacy_hub_13.jsx HumanScreen (lines 1156-1185)
 * and ManifestStatCardsScreen (lines 989-1066).
 */

import type { BaseTopicProps } from '../../layouts/registry.ts';
import React, { useState, useEffect } from "react";

import { useTheme } from "../../components/hooks/useTheme.ts";
import { useChrome } from "../../components/hooks/useChrome.ts";
import { usePresentationViewport } from "../../components/hooks/usePresentationViewport.ts";
import BackBtn from "../../components/navigation/BackBtn.tsx";
import Particles from "../../components/animations/Particles.tsx";
import type { Theme } from "../../tokens/themes.ts";
import type { StyleMode } from "../../tokens/style-modes.ts";

/** Fields used exclusively by ManifestStatCardsLayout (governance/leadership variant). */
interface ManifestTopic extends BaseTopicProps {
  kicker?: string;
  heroTitle?: string;
  thesis?: string;
  leadershipPoints?: string[];
  results?: Array<{ value?: string; label?: string; detail?: string }>;
  enablement?: string;
  enablementTitle?: string;
}

interface LayoutProps {
  topic: BaseTopicProps;
  onBack: () => void;
}

/* ───────────────────────────────────────────────────────────────────────────
 * StatCardsLayout — simple centered variant (formerly HumanScreen)
 * ─────────────────────────────────────────────────────────────────────────── */

function StatCardsLayout({ topic, onBack }: LayoutProps) {
  const T = useTheme() as Theme;
  const C = useChrome() as StyleMode;
  const viewport = usePresentationViewport();
  const [e,setE]=useState<boolean>(false); useEffect(()=>{const t=setTimeout(()=>setE(true),50);return()=>clearTimeout(t)},[]);
  return (
    <div style={{ position:"relative",minHeight:"100dvh",background:T.bg,overflowX:"hidden",overflowY:viewport.overlayScroll }}>
      <Particles color={topic.color} type="human" active={e}/>
      <div style={{ position:"relative",zIndex:2,maxWidth:900,margin:"0 auto",padding:`${viewport.pagePaddingTop + 8}px ${viewport.pagePaddingX}px ${viewport.pagePaddingBottom}px`,opacity:e?1:0,transform:e?"translateY(0)":"translateY(30px)",transition:"all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
        <BackBtn onClick={onBack}/>
        <div style={{ textAlign:"center",marginBottom:viewport.isPhone ? 28 : 48 }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:topic.color+"18",border:`2px solid ${topic.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 20px",boxShadow:`0 0 40px ${topic.colorGlow}` }}>{topic.icon}</div>
          <h1 style={{ fontFamily:T.fontDisplay,fontSize:viewport.heroTitleSize,fontWeight:C.headingWeight,color:T.text,margin:"0 0 8px",textTransform:C.headingTransform }}>{topic.title}</h1>
          <p style={{ fontSize:viewport.subtitleSize,color:topic.colorLight,fontStyle:"italic",margin:0 }}>{topic.subtitle}</p>
          <div style={{ width:80,height:C.accentBarHeight,background:topic.color,margin:"20px auto 0",borderRadius:2 }}/>
        </div>
        {(topic.cards ?? []).map((c,i)=>(<div key={i} style={{ background:T.bgCard,borderRadius:C.innerRadius,padding:viewport.isPhone?"20px 18px":"28px 32px",marginBottom:viewport.cardGap,display:"flex",flexDirection:viewport.isPhone?"column":"row",alignItems:viewport.isPhone?"stretch":"flex-start",gap:viewport.isPhone?14:24,borderLeft:`${C.accentBarHeight+1}px solid ${topic.color}`,opacity:e?1:0,transform:e?"translateY(0)":"translateY(20px)",transition:`all 0.6s ${0.3+i*0.15}s cubic-bezier(0.22,1,0.36,1)` }}>
          <div style={{ flexShrink:0,textAlign:"center",minWidth:72 }}><div style={{ fontFamily:T.fontDisplay,fontSize:32,fontWeight:C.headingWeight,color:topic.colorLight }}>{c.stat as string}</div><div style={{ fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:1,marginTop:2 }}>{c.statLabel as string}</div></div>
          <div><h3 style={{ fontFamily:T.fontDisplay,fontSize:viewport.isPhone?16:18,fontWeight:C.headingWeight,color:topic.colorLight,margin:"0 0 8px" }}>{c.title as string}</h3><p style={{ fontSize:viewport.isPhone?13:14,color:T.textMuted,lineHeight:1.6,margin:0 }}>{c.body as string}</p></div>
        </div>))}
        <div style={{ textAlign:"center",marginTop:viewport.isPhone?24:32,padding:viewport.isPhone?"18px 0":"24px",borderTop:`1px solid ${topic.color}20`,borderBottom:`1px solid ${topic.color}20`,opacity:e?1:0,transition:"opacity 1s 0.9s" }}>
          <p style={{ fontSize:viewport.subtitleSize,color:T.textMuted,lineHeight:1.6,margin:0,maxWidth:600,marginLeft:"auto",marginRight:"auto" }}><span style={{ color:topic.colorLight,fontWeight:700 }}>&ldquo;{topic.callout}&rdquo;</span></p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * ManifestStatCardsLayout — governance variant with leadership points,
 * results row, and enablement callout (formerly ManifestStatCardsScreen)
 * ─────────────────────────────────────────────────────────────────────────── */

function ManifestStatCardsLayout({ topic, onBack }: LayoutProps) {
  // Cast once at component entry; all family-specific fields are typed via ManifestTopic.
  const t = topic as ManifestTopic;
  const T = useTheme() as Theme;
  const C = useChrome() as StyleMode;
  const viewport = usePresentationViewport();
  const [entered, setEntered] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: T.bg, overflowX: "hidden", overflowY: viewport.overlayScroll }}>
      <Particles color={t.color} type="human" active={entered} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1260, margin: "0 auto", padding: `${viewport.pagePaddingTop}px ${viewport.pagePaddingX}px ${viewport.pagePaddingBottom}px` }}>
        <BackBtn onClick={onBack} />
        <div style={{ display: "grid", gridTemplateColumns: viewport.isCompact ? "1fr" : "1.15fr 0.85fr", gap: viewport.cardGap, marginBottom: 18 }}>
          <div style={{ opacity: entered ? 1 : 0, transform: entered ? "translateY(0)" : "translateY(22px)", transition: "all 0.6s ease" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: t.colorLight, fontFamily: T.fontDisplay, marginBottom: 8 }}>{t.kicker || t.eyebrow || "Governance"}</div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: viewport.titleSize, color: T.text, margin: "0 0 10px", lineHeight: 1.06 }}>{t.heroTitle || t.title}</h1>
            <p style={{ fontSize: viewport.subtitleSize, color: t.colorLight, fontStyle: "italic", margin: "0 0 12px", lineHeight: 1.5 }}>{t.subtitle}</p>
            {t.thesis && <p style={{ fontSize: viewport.bodySize, color: T.textMuted, lineHeight: 1.7, margin: 0 }}>{t.thesis}</p>}
          </div>
          <div style={{ background: `linear-gradient(180deg, ${T.bgCard}, ${T.bgDeep})`, borderRadius: C.cardRadius, padding: viewport.isPhone ? "16px 16px" : "18px 20px", border: `${C.cardBorderWidth}px solid ${t.color}24`, opacity: entered ? 1 : 0, transition: "opacity 0.6s 0.1s ease" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2.5, color: t.colorLight, fontFamily: T.fontDisplay, marginBottom: 8 }}>Leadership Points</div>
            <div style={{ display: "grid", gap: 10 }}>
              {(t.leadershipPoints ?? []).map((point, index) => (
                <div key={`${point}-${index}`} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 10, alignItems: "start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${t.color}18`, color: t.colorLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{index + 1}</div>
                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: viewport.isPhone ? "1fr" : viewport.isCompact ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
          {(t.cards ?? []).map((card, index) => (
            <div key={`${(card.title as string) || index}-${index}`} style={{ background: T.bgCard, borderRadius: C.cardRadius, padding: viewport.isPhone ? "16px 16px" : "18px 20px", borderTop: `${C.accentBarHeight}px solid ${t.color}`, opacity: entered ? 1 : 0, transform: entered ? "translateY(0)" : "translateY(18px)", transition: `all 0.45s ${0.12 + index * 0.08}s ease` }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2.2, color: t.colorLight, fontFamily: T.fontDisplay, marginBottom: 8 }}>{(card.step as string) || (card.marker as string) || `0${index + 1}`}</div>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: viewport.isPhone ? 18 : 21, color: T.text, margin: "0 0 8px", lineHeight: 1.15 }}>{card.title as string}</h3>
              {((card.eyebrow as string) || (card.statLabel as string)) && <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 8 }}>{String((card.eyebrow as string) || (card.statLabel as string))}</div>}
              {(card.highlight as string) && <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: "0 0 10px", fontWeight: 600 }}>{String(card.highlight)}</p>}
              {(card.body as string) && <p style={{ fontSize: 13.5, color: T.textMuted, lineHeight: 1.6, margin: (card.highlight as string) ? "0" : "0 0 10px" }}>{String(card.body)}</p>}
              {Array.isArray(card.details) && (card.details as unknown[]).length > 0 && (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {(card.details as string[]).map((detail, detailIndex) => (
                    <div key={`${detail}-${detailIndex}`} style={{ paddingTop: 8, borderTop: `1px solid ${t.color}14`, fontSize: 13, color: T.textMuted, lineHeight: 1.55 }}>{detail}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {(t.results?.length ?? 0) > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: viewport.isPhone ? "1fr 1fr" : `repeat(${Math.min(t.results!.length, 4)}, minmax(0, 1fr))`, gap: 12, marginBottom: 18 }}>
            {t.results!.map((result, index) => (
              <div key={`${result.label || index}-${index}`} style={{ background: `linear-gradient(180deg, ${T.bgCard}, ${T.bgDeep})`, borderRadius: C.innerRadius, padding: viewport.isPhone ? "14px 14px" : "16px 18px", border: `${C.cardBorderWidth}px solid ${t.color}18` }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 30, color: t.colorLight, marginBottom: 4 }}>{result.value}</div>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: result.detail ? 8 : 0 }}>{result.label}</div>
                {result.detail && <p style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>{result.detail}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: T.bgCard, borderRadius: C.cardRadius, padding: "18px 20px", borderLeft: `${C.accentBarHeight + 1}px solid ${t.color}` }}>
          {t.enablement && <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, margin: "0 0 10px" }}>{t.enablementTitle ? <strong style={{ color: t.colorLight }}>{t.enablementTitle}: </strong> : null}{t.enablement}</p>}
          <p style={{ fontFamily: T.fontDisplay, fontSize: 24, color: T.text, margin: 0 }}>{t.callout}</p>
        </div>
      </div>
    </div>
  );
}

export default StatCardsLayout;
export { StatCardsLayout, ManifestStatCardsLayout };
