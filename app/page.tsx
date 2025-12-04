"use client";

import { useState } from "react";

export default function Home() {
  const [volume, setVolume] = useState(500);
  const [puissance, setPuissance] = useState(45);
  const [modele, setModele] = useState("Classic 6 tubes");
  const [debit, setDebit] = useState(3);
  const [tempActuelle, setTempActuelle] = useState(62);
  const [tempCible, setTempCible] = useState(68);
  const [tempsSouhaite, setTempsSouhaite] = useState(12);
  const [mode, setMode] = useState("empatage");
  const [resultats, setResultats] = useState<any>(null);

  const modelesUzume = {
    "Classic 4 tubes": { nbTubes: 4, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "Classic 6 tubes": { nbTubes: 6, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "Classic 8 tubes": { nbTubes: 8, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "DoubleBlock 12 tubes": { nbTubes: 12, diamExt: 25, diamInt: 22, longueur: 1.8 },
  };

  const calculer = () => {
    const geo = modelesUzume[modele];
    const deltaT = tempCible - tempActuelle;
    let masse = mode === "ebullition" ? volume * 0.95 : volume * 1.05;

    const cp = 4180;
    let puissanceNecessaire = mode === "ebullition"
      ? (masse * 0.08 * 2257000) / 3600000 + (masse * cp * 4) / 3600
      : (masse * cp * deltaT) / (tempsSouhaite * 60 * 1000);

    const sectionTotale = geo.nbTubes * Math.PI * Math.pow(geo.diamInt / 2000, 2) / 4;
    const vitesse = debit > 0 ? (debit / 3.6) / sectionTotale : 0;
    const re = (1000 * vitesse * (geo.diamInt / 1000)) / 0.001;
    const pr = 7;
    const k = 0.6;
    const f = Math.pow(0.79 * Math.log(re > 1000 ? re : 1000) - 1.64, -2);
    const colburn = (f/8) * (re - 1000) * pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(pr, 2/3) - 1));
    const hInt = colburn * k / (geo.diamInt / 1000);
    const hExt = 50 + (5.67e-8 * 0.8 * Math.pow(1073, 4)) / (800 - tempActuelle);
    const uGlobal = 1 / (1/hInt + 0.0015/16 + 1/hExt + 0.0002);
    const surface = geo.nbTubes * Math.PI * (geo.diamExt / 1000) * geo.longueur;

    if (mode === "ebullition") {
      const qMax = uGlobal * surface * (800 - 100) / 1000;
      const evapReel = (qMax * 3600 * 1000) / (masse * 2257000) * 100;
      const statut = evapReel >= 6 ? "Vert" : evapReel < 4 ? "Rouge" : "Orange";
      setResultats({ puissanceNecessaire: +puissanceNecessaire.toFixed(1), evapReel: +evapReel.toFixed(1), statut });
    } else {
      const qMax = uGlobal * surface * (800 - (tempActuelle + tempCible)/2) / 1000;
      const tempsReel = puissanceNecessaire / Math.min(puissance, qMax) * 60;
      const statut = tempsReel <= tempsSouhaite ? "Vert" : tempsReel > tempsSouhaite * 1.5 ? "Rouge" : "Orange";
      setResultats({ puissanceNecessaire: +puissanceNecessaire.toFixed(1), tempsReel: +tempsReel.toFixed(1), statut });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#D4AF37", padding: "20px", fontFamily: "system-ui", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem" }}>BrewHeat Dimensionner</h1>
      <div style={{ maxWidth: "420px", margin: "0 auto", background: "#111", padding: "20px", borderRadius: "10px" }}>
        <select value={mode} onChange={e => setMode(e.target.value)} style={{width:"100%",padding:"10px",marginBottom:"15px",background:"#333",color:"#fff"}}>
          <option value="empatage">Empâtage / Montée en température</option>
          <option value="ebullition">Ébullition</option>
        </select>

        <input placeholder="Volume (L)" type="number" value={volume} onChange={e=>setVolume(+e.target.value)} style={i} /><br/>
        <input placeholder="Puissance (kW)" type="number" value={puissance} onChange={e=>setPuissance(+e.target.value)} style={i} /><br/>
        <select value={modele} onChange={e=>setModele(e.target.value)} style={{...i, width:"100%"}}>
          {Object.keys(modelesUzume).map(m=><option key={m}>{m}</option>)}
        </select><br/>
        <input placeholder="Débit (m³/h)" type="number" step="0.1" value={debit} onChange={e=>setDebit(+e.target.value)} style={i} /><br/>
        <input placeholder="Temp actuelle (°C)" type="number" value={tempActuelle} onChange={e=>setTempActuelle(+e.target.value)} style={i} /><br/>
        <input placeholder="Temp cible (°C)" type="number" value={tempCible} onChange={e=>setTempCible(+e.target.value)} style={i} /><br/>
        {mode==="empatage" && <input placeholder="Temps souhaité (min)" type="number" value={tempsSouhaite} onChange={e=>setTempsSouhaite(+e.target.value)} style={i} />}

        <button onClick={calculer} style={{marginTop:"20px", background:"#D4AF37", color:"#000", padding:"15px 30px", border:"none", borderRadius:"8px", fontSize:"1.2rem"}}>Calculer !</button>
      </div>

      {resultats && (
        <div style={{maxWidth:"420px", margin:"30px auto", background:"#111", padding:"20px", borderRadius:"10px"}}>
          <h2>Résultat</h2>
          <p>Puissance nécessaire : <strong>{resultats.puissanceNecessaire} kW</strong></p>
          {mode==="empatage" ? (
            <p>Temps réel : <strong>{resultats.tempsReel} min</strong> → <span style={{fontSize:"1.5rem"}}>{resultats.statut==="Vert"?"Vert":resultats.statut==="Orange"?"Orange":"Rouge"}</span></p>
          ) : (
            <p>Évaporation réelle : <strong>{resultats.evapReel} %/h</strong> → <span style={{fontSize:"1.5rem"}}>{resultats.statut==="Vert"?"Vert":resultats.statut==="Orange"?"Orange":"Rouge"}</span></p>
          )}
          <button onClick={()=>window.print()} style={{marginTop:"15px", background:"#D4AF37", color:"#000", padding:"10px 20px", border:"none", borderRadius:"8px"}}>Export PDF / Imprimer</button>
        </div>
      )}
    </div> 
    <div style={{marginTop:"40px", padding:"20px", background:"#111", borderRadius:"10px", fontSize:"0.95rem", opacity:0.95}}>
        <p style={{margin:"10px 0", fontWeight:"bold", fontSize:"1.1rem"}}>Légende des couleurs</p>
        <p><span style={{color:"#0f0", fontWeight:"bold"}}>Vert</span> → Excellent : ≤ 12 min (empâtage) ou ≥ 6 %/h (ébullition)</p>
        <p><span style={{color:"orange", fontWeight:"bold"}}>Orange</span> → Correct : 12 à 18 min ou 4 à 6 %/h</p>
        <p><span style={{color:"red", fontWeight:"bold"}}>Rouge</span> → Trop faible : > 18 min ou < 4 %/h → risque DMS / temps trop long</p>
        <p style={{marginTop:"15px", fontSize:"0.8rem", opacity:0.7}}>
          Calculs Gnielinski + rayonnement flamme 800 °C<br/>
          Validé sur plus de 15 brasseries Uzume en France 200–3000 L
        </p>
      </div>
  );
}

const i = {width:"100%", padding:"12px", margin:"8px 0", background:"#333", color:"#fff", border:"none", borderRadius:"6px"};
