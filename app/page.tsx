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
  const [resultats, setResultats] = useState(null);
  const [mode, setMode] = useState("empatage");

  const modelesUzume = {
    "Classic 4 tubes": { nbTubes: 4, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "Classic 6 tubes": { nbTubes: 6, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "Classic 8 tubes": { nbTubes: 8, diamExt: 25, diamInt: 22, longueur: 1.2 },
    "DoubleBlock 12 tubes": { nbTubes: 12, diamExt: 25, diamInt: 22, longueur: 1.8 },
  };

  const calculer = () => {
    const geo = modelesUzume[modele];
    let masse = volume * 1.05; // kg
    const cp = 4180; // J/kg.K
    const deltaT = tempCible - tempActuelle;
    let puissanceNecessaire;
    if (mode === "ebullition") {
      masse = volume * 0.95;
      const latent = 2257e3;
      const evapRate = 0.08;
      puissanceNecessaire = (masse * evapRate * latent) / (3600 * 1000) + (masse * cp * 4) / 3600;
    } else {
      puissanceNecessaire = (masse * cp * deltaT) / (tempsSouhaite * 60 * 1000);
    }

    const sectionTotale = geo.nbTubes * Math.PI * Math.pow(geo.diamInt / 2000, 2) / 4;
    const vitesse = (debit / 3.6) / sectionTotale;
    const viscosite = 0.001;
    const densite = 1000;
    const re = (densite * vitesse * (geo.diamInt / 1000)) / viscosite;
    const pr = 7;
    const k = 0.6;
    const f = Math.pow(0.79 * Math.log(re) - 1.64, -2);
    const colburn = (f/8) * (re - 1000) * pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(pr, 2/3) - 1));
    const hInt = colburn * k / (geo.diamInt / 1000);
    const tempFlamme = 800;
    const emissivite = 0.8;
    const hExt = 50 + (5.67e-8 * emissivite * Math.pow(tempFlamme + 273, 4)) / (tempFlamme - tempActuelle);
    const epaisseur = 0.0015;
    const kMat = 16;
    const fouling = 0.0002;
    const uGlobal = 1 / (1/hInt + epaisseur/kMat + 1/hExt + fouling);
    const surface = geo.nbTubes * Math.PI * (geo.diamExt / 1000) * geo.longueur;

    let tempsReel, evapReel, statut;
    if (mode === "ebullition") {
      const qMax = uGlobal * surface * (tempFlamme - tempCible) / 1000;
      evapReel = (qMax * 3600 * 1000 / 2257e3) / masse * 100;
      statut = evapReel >= 6 ? "Vert ✅" : evapReel < 4 ? "Rouge ⚠️" : "Orange ⚠️";
      setResultats({ puissanceNecessaire: Math.round(puissanceNecessaire * 10) / 10, vitesse: Math.round(vitesse * 100) / 100, re: Math.round(re), hInt: Math.round(hInt), uGlobal: Math.round(uGlobal), surface: Math.round(surface * 100) / 100, evapReel: Math.round(evapReel * 10) / 10, statut });
    } else {
      const qMax = uGlobal * surface * (tempFlamme - (tempActuelle + tempCible)/2) / 1000;
      tempsReel = Math.max(puissanceNecessaire / Math.min(puissance, qMax), 1);
      statut = tempsReel <= tempsSouhaite ? "Vert ✅" : tempsReel > tempsSouhaite * 1.5 ? "Rouge ⚠️" : "Orange ⚠️";
      setResultats({ puissanceNecessaire: Math.round(puissanceNecessaire * 10) / 10, vitesse: Math.round(vitesse * 100) / 100, re: Math.round(re), hInt: Math.round(hInt), uGlobal: Math.round(uGlobal), surface: Math.round(surface * 100) / 100, tempsReel: Math.round(tempsReel * 100) / 100, statut });
    }
  };

  const graphiqueTemp = () => {
    if (!resultats || mode === "ebullition") return <p>Graphique ébullition : Maintien {tempCible}°C, évap {resultats?.evapReel || 0}%/h</p>;
    const points = Array.from({length: 11}, (_, i) => tempActuelle + deltaT * i / 10);
    return (
      <div style={{background: '#111', padding: '10px', borderRadius: '4px', marginTop: '10px'}}>
        <p>Profil temp. (ASCII) :</p>
        <pre style={{fontSize: '12px', color: '#D4AF37'}}>
{points.map((t, i) => `\( {i} min: \){t.toFixed(0)}°C${i % 2 === 0 ? ' *' : '  '}`).join('\n')}
        </pre>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#BFAF83', padding: '20px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>🍺 BrewHeat Dimensionner</h1>
      <div style={{ maxWidth: '400px', margin: '0 auto', background: '#111', padding: '20px', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Mode : <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', marginLeft: '10px' }}>
            <option value="empatage">Empâtage</option>
            <option value="ebullition">Ébullition</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Volume (L): <input type="number" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Puissance (kW): <input type="number" value={puissance} onChange={(e) => setPuissance(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Modèle: <select value={modele} onChange={(e) => setModele(e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '200px' }}>
          {Object.keys(modelesUzume).map(m => <option key={m}>{m}</option>)}
        </select></label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Débit (m³/h): <input type="number" step="0.1" value={debit} onChange={(e) => setDebit(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Temp actuelle (°C): <input type="number" value={tempActuelle} onChange={(e) => setTempActuelle(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>
        <label style={{ display: 'block', marginBottom: '10px' }}>Temp cible (°C): <input type="number" value={tempCible} onChange={(e) => setTempCible(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>
        {mode === "empatage" && <label style={{ display: 'block', marginBottom: '10px' }}>Temps souhaité (min): <input type="number" value={tempsSouhaite} onChange={(e) => setTempsSouhaite(+e.target.value)} style={{ background: '#333', color: '#fff', padding: '5px', width: '80px' }} /></label>}
        <button onClick={calculer} style={{ background: '#D4AF37', color: '#000', padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Calculer !</button>
      </div>
      {resultats && (
        <div style={{ maxWidth: '400px', margin: '20px auto', background: '#111', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ color: '#D4AF37' }}>Résultats :</h2>
          <p>Puissance nécessaire : {resultats.puissanceNecessaire} kW</p>
          <p>Vitesse : {resultats.vitesse} m/s</p>
          <p>Re : {resultats.re}</p>
          <p>h_int : {resultats.hInt} W/m².K</p>
          <p>U global : {resultats.uGlobal} W/m².K</p>
          <p>Surface : {resultats.surface} m²</p>
          {mode === "empatage" ? <p>Temps réel : {resultats.tempsReel} min <span style={{ color: resultats.statut.includes('Vert') ? 'green' : resultats.statut.includes('Rouge') ? 'red' : 'orange' }}>{resultats.statut}</span></p> : <p>Évaporation : {resultats.evapReel}%/h <span style={{ color: resultats.statut.includes('Vert') ? 'green' : resultats.statut.includes('Rouge') ? 'red' : 'orange' }}>{resultats.statut}</span></p>}
          {graphiqueTemp()}
          <button onClick={() => window.print()} style={{ background: '#D4AF37', color: '#000', padding: '5px 10px', borderRadius: '4px', marginTop: '10px' }}>Export PDF</button>
        </div>
      )}
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>Calculs précis (Gnielinski, rayonnement) – Pour brasseurs 🍻</p>
    </div>
  );
}
