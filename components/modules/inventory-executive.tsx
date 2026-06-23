"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calculator,
  CalendarClock,
  CalendarDays,
  ChartScatter,
  Check,
  ChevronDown,
  CircleDollarSign,
  Cctv,
  ChefHat,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Files,
  GraduationCap,
  KeyRound,
  Layers3,
  LayoutGrid,
  Lightbulb,
  Maximize2,
  MessageCircle,
  Minimize2,
  Network,
  PanelsTopLeft,
  Printer,
  Search,
  ShieldCheck,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
  Unplug,
  UserRoundX,
  UserSearch,
  WalletCards,
  Workflow,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  actionLabels,
  adoptionLabels,
  criticalityLabels,
  executiveThreads,
  executiveTools,
  riskLabels,
  type ExecutiveAction,
  type ExecutiveTool
} from "@/lib/inventory-executive";
import styles from "./inventory-executive.module.css";

type SortMode = "crit" | "cost" | "waste" | "action";

const criticalityRank = { critica: 4, alta: 3, media: 2, baja: 1 } as const;
const riskRank = { alto: 3, medio: 2, bajo: 1 } as const;
const actionRank = { stop: 3, change: 2, keep: 1 } as const;

export function InventoryExecutive() {
  const [sortMode, setSortMode] = useState<SortMode>("crit");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [highlightedTool, setHighlightedTool] = useState<string | null>(null);

  const sortedTools = useMemo(() => {
    return [...executiveTools].sort((a, b) => {
      if (sortMode === "cost") return b.costValue - a.costValue;
      if (sortMode === "waste") return b.wasteValue - a.wasteValue;
      if (sortMode === "action") return actionRank[b.action] - actionRank[a.action] || score(b) - score(a);
      return score(b) - score(a);
    });
  }, [sortMode]);

  const allExpanded = expanded.size === executiveTools.length;

  function openTool(id: string) {
    setExpanded((current) => new Set(current).add(id));
    setHighlightedTool(id);
    window.setTimeout(() => {
      document.getElementById(`executive-tool-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    window.setTimeout(() => setHighlightedTool((current) => current === id ? null : current), 1600);
  }

  function toggleTool(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(executiveTools.map((tool) => tool.id)));
  }

  return (
    <div className={styles.root}>
      <ExecutiveHero />
      <ExecutiveKpis />

      <ExecutiveSection
        icon={<ChartScatter size={20} />}
        title="¿Dónde duele? — Criticidad × Riesgo"
        description="Cada herramienta está ubicada según qué tan crítica es para la operación y qué tan alto es su nivel de riesgo. El tamaño refleja su costo. El cuadrante superior derecho es donde hay que actuar primero. Pasa el mouse o haz clic en una burbuja para identificarla y abrir su tarjeta."
      >
        <div className={styles.matrixWrap}>
          <div className={styles.matrixScroller}>
            <div className={styles.matrix} onMouseLeave={() => setActiveTool(null)}>
              <div className={styles.verticalLine} />
              <div className={styles.horizontalLine} />
              <span className={`${styles.zone} ${styles.zoneAction}`}><AlertTriangle size={13} /> Actuar primero</span>
              <span className={`${styles.zone} ${styles.zoneWatch}`}><Eye size={13} /> Vigilar / optimizar</span>
              <span className={`${styles.axis} ${styles.axisX}`}>Riesgo →</span>
              <span className={`${styles.axis} ${styles.axisY}`}>Criticidad →</span>

              {executiveTools.map((tool, index) => (
                <button
                  key={tool.id}
                  type="button"
                  aria-label={`Abrir diagnóstico de ${tool.name}`}
                  className={`${styles.bubble} ${styles[tool.action]} ${activeTool === tool.id ? styles.bubbleActive : ""}`}
                  style={{ left: `${tool.mx.x}%`, top: `${tool.mx.y}%`, width: tool.mx.r * 2, height: tool.mx.r * 2, fontSize: tool.mx.r < 14 ? 11 : 14 }}
                  onMouseEnter={() => setActiveTool(tool.id)}
                  onFocus={() => setActiveTool(tool.id)}
                  onBlur={() => setActiveTool(null)}
                  onClick={() => openTool(tool.id)}
                >
                  {index + 1}
                </button>
              ))}

              {activeTool ? <MatrixTooltip tool={executiveTools.find((tool) => tool.id === activeTool)!} /> : null}
            </div>
          </div>

          <div>
            <p className={styles.legendTitle}>PRIORIDAD · MAYOR A MENOR</p>
            <div className={styles.legendList}>
              {[...executiveTools].sort((a, b) => score(b) - score(a)).map((tool) => {
                const number = executiveTools.findIndex((item) => item.id === tool.id) + 1;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={`${styles.legendItem} ${activeTool === tool.id ? styles.legendActive : ""}`}
                    onMouseEnter={() => setActiveTool(tool.id)}
                    onMouseLeave={() => setActiveTool(null)}
                    onFocus={() => setActiveTool(tool.id)}
                    onBlur={() => setActiveTool(null)}
                    onClick={() => openTool(tool.id)}
                  >
                    <span className={`${styles.legendNumber} ${styles[tool.action]}`}>{number}</span>
                    <span className={styles.legendName}>{tool.name}</span>
                    <span className={styles.legendMeta}>{criticalityLabels[tool.crit].slice(0, 4)} · {riskLabels[tool.risk]}<br />{tool.cost === "$0" ? "sin costo" : `${tool.cost}${tool.costPer}`}</span>
                  </button>
                );
              })}
            </div>
            <MatrixLegend />
          </div>
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        icon={<LayoutGrid size={20} />}
        title="Las 12 herramientas, una por una"
        description="Vista colapsada: adopción, criticidad, riesgo, costo, capacidad usada y recomendación. Expande cada tarjeta para consultar fortalezas, debilidades, pendientes y plan de mediano plazo."
      >
        <div className={styles.controls}>
          <span className={styles.controlLabel}>Ordenar por</span>
          <div className={styles.segments}>
            <SortButton mode="crit" active={sortMode} onSelect={setSortMode}>Criticidad + riesgo</SortButton>
            <SortButton mode="cost" active={sortMode} onSelect={setSortMode}>Costo</SortButton>
            <SortButton mode="waste" active={sortMode} onSelect={setSortMode}>Desperdicio</SortButton>
            <SortButton mode="action" active={sortMode} onSelect={setSortMode}>Tipo de decisión</SortButton>
          </div>
          <button type="button" className={styles.expandButton} onClick={toggleAll}>
            {allExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            {allExpanded ? "Colapsar todo" : "Expandir todo"}
          </button>
        </div>

        <div className={styles.cards}>
          {sortedTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              expanded={expanded.has(tool.id)}
              highlighted={highlightedTool === tool.id}
              onToggle={() => toggleTool(tool.id)}
            />
          ))}
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        icon={<Unplug size={20} />}
        title="Los hilos rojos del ecosistema"
        description="Patrones que se repiten en casi todas las herramientas: no son problemas de un software, son problemas del sistema. Aquí está el verdadero trabajo de fondo."
      >
        <div className={styles.threads}>
          {executiveThreads.map((thread) => (
            <article key={thread.title} className={styles.thread}>
              <span className={styles.threadIcon}>{threadIcon(thread.icon)}</span>
              <strong>{thread.title}</strong>
              <p>{thread.body}</p>
            </article>
          ))}
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        icon={<Network size={20} />}
        title="El mapa de la (des)integración"
        description="Las 12 herramientas y cómo se conectan —o sobre todo cómo no se conectan— con el SIIS, núcleo del ecosistema. Las líneas rotas son los puntos donde el dato se vuelve a digitar a mano; las herramientas dentro del recuadro punteado operan como islas."
      >
        <IntegrationMap />
      </ExecutiveSection>

      <ExecutiveSection
        icon={<Files size={20} />}
        title="Fichas de software · documento fuente"
        description="Esta vista ejecutiva se destila de 12 fichas individuales, cada una con el diagnóstico completo del producto. Abre cada ficha para consultar el detalle en una pestaña nueva."
      >
        <SheetsTable />
      </ExecutiveSection>

      <footer className={styles.footer}>
        <span><b>Vena Digital</b> · Diagnóstico tecnológico — Clínica Pinares</span>
        <span>Vista ejecutiva consolidada · Fase 1 — Inventario · derivada de las 12 fichas de software</span>
      </footer>
    </div>
  );
}

function ExecutiveHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div>
          <p className={styles.eyebrow}>Diagnóstico tecnológico · Fase 1 — Inventario</p>
          <h1 className={styles.heroTitle}>Ecosistema Tecnológico<br /><span className={styles.accent}>Vista Ejecutiva</span></h1>
          <p className={styles.heroCopy}>Radiografía consolidada de las 12 herramientas que sostienen la operación de Clínica Pinares: dónde está el riesgo, dónde se va la plata, qué se paga sin usar y qué decidir. Cada tarjeta se expande para ver el diagnóstico completo del consultor.</p>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.heroTag}><Layers3 size={14} /> Consolidado F1</div>
          <div>Clínica Pinares — El Retiro, Antioquia</div>
          <div>Laura Salazar · Vena Digital</div>
          <div>Junio 2026 · Base: 12 fichas de software</div>
        </div>
      </div>
    </header>
  );
}

function ExecutiveKpis() {
  const rows = [
    { icon: <PanelsTopLeft size={19} />, value: "12", label: "Herramientas en el ecosistema", className: "" },
    { icon: <WalletCards size={19} />, value: "~$7,6M", suffix: "/mes", label: "Gasto tecnológico recurrente", className: styles.kpiSpend },
    { icon: <CalendarClock size={19} />, value: "~$91M", suffix: "/año", label: "Costo anual estimado", className: styles.kpiSpend },
    { icon: <AlertTriangle size={19} />, value: "5", label: "Herramientas en zona de acción urgente", className: styles.kpiAlert },
    { icon: <CircleDollarSign size={19} />, value: "7 / 12", label: "Con capacidad pagada sin aprovechar", className: styles.kpiWaste }
  ];
  return (
    <div className={styles.kpis}>
      {rows.map((row) => (
        <article key={row.label} className={`${styles.kpi} ${row.className}`}>
          <span className={styles.kpiIcon}>{row.icon}</span>
          <p className={styles.kpiValue}>{row.value} {row.suffix ? <small>{row.suffix}</small> : null}</p>
          <p className={styles.kpiLabel}>{row.label}</p>
        </article>
      ))}
    </div>
  );
}

function ExecutiveSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}><span className={styles.sectionIcon}>{icon}</span><h2 className={styles.sectionTitle}>{title}</h2></div>
      <p className={styles.sectionCopy}>{description}</p>
      {children}
    </section>
  );
}

function MatrixTooltip({ tool }: { tool: ExecutiveTool }) {
  return (
    <div className={styles.tooltip} style={{ left: `${tool.mx.x}%`, top: `calc(${tool.mx.y}% - ${tool.mx.r + 14}px)` }}>
      <strong>{executiveTools.findIndex((item) => item.id === tool.id) + 1}. {tool.name}</strong>
      <span>Criticidad {criticalityLabels[tool.crit]} · Riesgo {riskLabels[tool.risk]} · {tool.cost}{tool.costPer}</span>
    </div>
  );
}

function MatrixLegend() {
  return (
    <div className={styles.legendKey}>
      <span className={styles.legendRow}><i className={`${styles.swatch} ${styles.keep}`} /> Mantener / optimizar lo que ya hay</span>
      <span className={styles.legendRow}><i className={`${styles.swatch} ${styles.change}`} /> Migrar / integrar / validar</span>
      <span className={styles.legendRow}><i className={`${styles.swatch} ${styles.stop}`} /> Detener / replantear / eliminar</span>
      <span className={styles.sizeKey}>
        <i className={styles.sizeCircle} style={{ width: 24, height: 24 }} />
        <i className={styles.sizeCircle} style={{ width: 15, height: 15 }} />
        <i className={styles.sizeCircle} style={{ width: 9, height: 9 }} />
        Tamaño = costo
      </span>
    </div>
  );
}

function SortButton({ mode, active, onSelect, children }: { mode: SortMode; active: SortMode; onSelect: (mode: SortMode) => void; children: React.ReactNode }) {
  return <button type="button" className={`${styles.sortButton} ${active === mode ? styles.sortActive : ""}`} onClick={() => onSelect(mode)}>{children}</button>;
}

function ToolCard({ tool, expanded, highlighted, onToggle }: { tool: ExecutiveTool; expanded: boolean; highlighted: boolean; onToggle: () => void }) {
  return (
    <article id={`executive-tool-${tool.id}`} className={`${styles.toolCard} ${highlighted ? styles.toolCardHighlighted : ""}`}>
      <span className={`${styles.cardAccent} ${styles[tool.action]}`} />
      <button type="button" className={styles.toolHeader} onClick={onToggle} aria-expanded={expanded}>
        <span className={`${styles.toolIcon} ${toolIconTone(tool.action)}`}>{toolIcon(tool.id)}</span>
        <span>
          <span className={styles.toolNameRow}><span className={styles.toolName}>{tool.name}</span><span className={styles.category}>{tool.cat}</span></span>
          <span className={styles.purpose}>{tool.purpose}</span>
          <span className={styles.toolFooter}>
            <span className={styles.meters}>
              <Meter label="Adopción" value={tool.adop} kind="adoption" />
              <Meter label="Criticidad" value={tool.crit} kind="criticality" />
              <Meter label="Riesgo" value={tool.risk} kind="risk" />
            </span>
            <span className={styles.cost}>{tool.cost} <small>{tool.costPer}</small></span>
            <span className={`${styles.useBadge} ${tool.useWarn ? styles.useWarn : ""}`}><CircleDollarSign size={13} /> {tool.use} {tool.useLbl}</span>
          </span>
        </span>
        <ChevronDown size={19} className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`} />
      </button>

      {expanded ? (
        <div className={styles.toolBody}>
          <div className={styles.recommendation}>
            <Lightbulb size={21} className={styles.recommendationIcon} />
            <div><strong>{tool.reco}</strong><p>{tool.recoMicro}</p></div>
          </div>
          <div className={styles.diagnosisGrid}>
            <Diagnosis title="Fortalezas" items={tool.good} icon="good" />
            <Diagnosis title="Debilidades" items={tool.bad} icon="bad" />
            <Diagnosis title="Pendientes por revisar" items={tool.pend} icon="pending" />
            <Diagnosis title="Mediano plazo" items={[tool.mid]} icon="action" />
            <div className={styles.metaRow}>
              <span className={styles.metaChip}><b>Costo:</b> {tool.cost} {tool.costPer} · {tool.costYear}</span>
              <span className={styles.metaChip}><b>Adopción:</b> {adoptionLabels[tool.adop]}</span>
              <span className={styles.metaChip}><b>Criticidad:</b> {criticalityLabels[tool.crit]}</span>
              <span className={styles.metaChip}><b>Riesgo:</b> {riskLabels[tool.risk]}</span>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Meter({ label, value, kind }: { label: string; value: ExecutiveTool["adop"] | ExecutiveTool["crit"] | ExecutiveTool["risk"]; kind: "adoption" | "criticality" | "risk" }) {
  const count = kind === "adoption" ? ({ alta: 3, media: 2, baja: 1, "muy baja": 1 } as const)[value as ExecutiveTool["adop"]] : kind === "criticality" ? ({ critica: 3, alta: 3, media: 2, baja: 1 } as const)[value as ExecutiveTool["crit"]] : ({ alto: 3, medio: 2, bajo: 1 } as const)[value as ExecutiveTool["risk"]];
  const tone = kind === "adoption" ? (count >= 3 ? "green" : count === 2 ? "amber" : "red") : count >= 3 ? "red" : count === 2 ? "amber" : "green";
  const text = kind === "adoption" ? adoptionLabels[value as ExecutiveTool["adop"]] : kind === "criticality" ? criticalityLabels[value as ExecutiveTool["crit"]] : riskLabels[value as ExecutiveTool["risk"]];
  return (
    <span>
      <span className={styles.meterLabel}>{label}</span>
      <span className={styles.meterRow}>
        <span className={styles.meterBars}>{[0, 1, 2].map((index) => <i key={index} className={`${styles.meterBar} ${index < count ? styles[`${tone}Bar`] : ""}`} />)}</span>
        <span className={`${styles.meterValue} ${styles[`${tone}Text`]}`}>{text}</span>
      </span>
    </span>
  );
}

function Diagnosis({ title, items, icon }: { title: string; items: string[]; icon: "good" | "bad" | "pending" | "action" }) {
  const config = {
    good: { titleIcon: <ThumbsUp size={14} />, itemIcon: <Check size={13} />, tone: styles.greenText },
    bad: { titleIcon: <ThumbsDown size={14} />, itemIcon: <X size={13} />, tone: styles.redText },
    pending: { titleIcon: <Search size={14} />, itemIcon: <Search size={13} />, tone: styles.amberText },
    action: { titleIcon: <Workflow size={14} />, itemIcon: <ArrowRight size={13} />, tone: "" }
  }[icon];
  return (
    <div className={styles.diagnosisBox}>
      <h3 className={`${styles.diagnosisTitle} ${config.tone}`}>{config.titleIcon}{title}</h3>
      <ul className={styles.diagnosisList}>{items.map((item) => <li key={item} className={styles.diagnosisItem}><span className={config.tone}>{config.itemIcon}</span><span>{item}</span></li>)}</ul>
    </div>
  );
}

function IntegrationMap() {
  return (
    <div className={styles.mapScroller}>
      <svg className={styles.map} viewBox="0 0 1080 720" role="img" aria-label="Mapa de integración del ecosistema tecnológico">
        <line x1="540" y1="250" x2="180" y2="72" stroke="#13A574" strokeWidth="3" />
        <line x1="540" y1="250" x2="540" y2="72" stroke="#13A574" strokeWidth="3" />
        <line x1="540" y1="250" x2="900" y2="72" stroke="#13A574" strokeWidth="3" />
        <line x1="245" y1="520" x2="135" y2="625" stroke="#13A574" strokeWidth="3" />
        <line x1="540" y1="250" x2="810" y2="250" stroke="#F0A12E" strokeWidth="3" strokeDasharray="7 5" />
        <line x1="935" y1="505" x2="935" y2="392" stroke="#F0A12E" strokeWidth="3" strokeDasharray="7 5" />
        {[[540,250,250,255],[250,255,150,385],[540,250,425,385],[540,250,615,388],[810,250,935,360],[245,520,380,615]].map((line, index) => <line key={index} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke="#E14B4B" strokeWidth="3" strokeDasharray="4 5" />)}
        <rect x="505" y="468" width="392" height="214" rx="16" fill="rgba(225,75,75,.05)" stroke="#E14B4B" strokeWidth="1.5" strokeDasharray="6 5" />
        <text x="524" y="492" fill="#A82F2F" fontSize="11.5" fontWeight="700">Islas digitales · operan sin integrarse</text>
        <MapRect x={495} width={90} label="DIAN" /><MapRect x={830} width={140} label="MinSalud · RIPS" /><MapRect x={115} width={130} label="Interop. RDA/IHC" />
        <MapNode x={540} y={250} r={58} color="#FF6B5E" label="SIIS" sublabel="HIS · núcleo" />
        <MapNode x={250} y={255} r={46} color="#2E6FC2" label="CoCo" sublabel="agenda" />
        <MapNode x={810} y={250} r={48} color="#6A60D6" label="SIIGO" sublabel="facturación" />
        <MapNode x={150} y={385} r={30} color="#6B7686" label="Wompi" sublabel="pagos" />
        <MapNode x={425} y={385} r={30} color="#6B7686" label="Zebra" sublabel="manillas" />
        <MapNode x={615} y={388} r={30} color="#6B7686" label="Wonder-" sublabel="share" />
        <MapNode x={935} y={360} r={32} color="#8B84DD" label="Contai/" sublabel="Nómina" />
        <MapNode x={935} y={505} r={32} color="#6B7686" label="iVMS" sublabel="4200 · acceso" />
        <MapNode x={245} y={520} r={46} color="#0E8A7D" label="M365" sublabel="Microsoft" />
        <MapNode x={135} y={625} r={34} color="#0E8A7D" label="Intranet" sublabel="+ Universidad" />
        <MapNode x={380} y={615} r={34} color="#6B7686" label="Luxflow" sublabel="en Google" />
        <MapNode x={585} y={565} r={32} color="#6B7686" label="FUDO" sublabel="cocina" />
        <MapNode x={720} y={560} r={36} color="#6B7686" label="Mundo" sublabel="Médicos" />
        <MapNode x={828} y={608} r={30} color="#6B7686" label="Kommo" sublabel="WA / IG" />
      </svg>
      <div className={styles.mapLegend}>
        <span><i className={`${styles.lineKey} ${styles.lineGreen}`} /> Integración activa</span>
        <span><i className={`${styles.lineKey} ${styles.lineAmber}`} /> Conexión manual (archivo plano)</span>
        <span><i className={`${styles.lineKey} ${styles.lineRed}`} /> Sin integrar — doble digitación</span>
        <span><i className={`${styles.lineKey} ${styles.lineGray}`} /> Isla — sin conexión con otros sistemas</span>
      </div>
    </div>
  );
}

function MapRect({ x, width, label }: { x: number; width: number; label: string }) {
  return <g><rect x={x} y="34" width={width} height="36" rx="9" fill="#0A2142" /><text x={x + width / 2} y="57" fill="white" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text></g>;
}

function MapNode({ x, y, r, color, label, sublabel }: { x: number; y: number; r: number; color: string; label: string; sublabel: string }) {
  return <g><circle cx={x} cy={y} r={r} fill={color} /><text x={x} y={y - 3} fill="white" fontSize={r > 40 ? 15 : 11} fontWeight="800" textAnchor="middle">{label}</text><text x={x} y={y + 14} fill="white" fontSize="8.5" textAnchor="middle">{sublabel}</text></g>;
}

function SheetsTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>Producto</th><th>Categoría</th><th>Decisión</th><th>Ficha</th></tr></thead>
        <tbody>
          {executiveTools.map((tool) => (
            <tr key={tool.id}>
              <td><span className={styles.tableName}><span className={`${styles.tableIcon} ${toolIconTone(tool.action)}`}>{toolIcon(tool.id)}</span>{tool.name}</span></td>
              <td>{tool.cat}</td>
              <td><span className={`${styles.decision} ${decisionTone(tool.action)}`}>{actionLabels[tool.action]}</span></td>
              <td><a href={`/inventario/fichas/${tool.sheetSlug}`} target="_blank" rel="noopener noreferrer" className={styles.sheetLink}><ExternalLink size={14} /> Abrir ficha</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function score(tool: ExecutiveTool) { return criticalityRank[tool.crit] * 10 + riskRank[tool.risk]; }
function toolIconTone(action: ExecutiveAction) { return action === "keep" ? styles.toolIconKeep : action === "change" ? styles.toolIconChange : styles.toolIconStop; }
function decisionTone(action: ExecutiveAction) { return action === "keep" ? styles.decisionKeep : action === "change" ? styles.decisionChange : styles.decisionStop; }

function toolIcon(id: string) {
  const icons: Record<string, React.ReactNode> = {
    siis: <Activity size={21} />, siigo: <Calculator size={21} />, coco: <CalendarDays size={21} />, m365: <PanelsTopLeft size={21} />,
    luxflow: <Workflow size={21} />, ivms: <Cctv size={21} />, mundo: <Stethoscope size={21} />, fudo: <ChefHat size={21} />,
    intranet: <GraduationCap size={21} />, kommo: <MessageCircle size={21} />, zebra: <Printer size={21} />, wondershare: <ShieldCheck size={21} />
  };
  return icons[id] ?? <Layers3 size={21} />;
}

function threadIcon(icon: string) {
  const icons: Record<string, React.ReactNode> = {
    owner: <UserSearch size={21} />, integration: <Unplug size={21} />, waste: <CircleDollarSign size={21} />,
    keys: <KeyRound size={21} />, users: <UserRoundX size={21} />, excel: <FileSpreadsheet size={21} />
  };
  return icons[icon] ?? <AlertTriangle size={21} />;
}
