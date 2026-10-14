# VirtualLab 11-12 🔬

> High-Precision Interactive Laboratory Instrument Simulator designed for Class 11 & 12 (CBSE / ISC / AP) Science Students.

VirtualLab 11-12 empowers students to master laboratory instruments, procedural millimeter-accurate measurements, zero error corrections, observation tables, and viva voce challenges directly in their browser.

---

## 🌟 Instruments Implemented

### 1. Vernier Caliper (Physics Core)
- **Procedural Canvas Rendering**: Millimeter-accurate metric main scale ($0 - 130\text{ mm}$) and secondary imperial reference scale.
- **Selectable Vernier Scale**:
  - $10\text{ divisions}$ ($\text{Least Count} = 0.10\text{ mm}$, where $10\text{ VSD} = 9\text{ MSD}$)
  - $20\text{ divisions}$ ($\text{Least Count} = 0.05\text{ mm}$, where $20\text{ VSD} = 19\text{ MSD}$)
- **Synchronized Movements**: Lower external jaws, upper internal jaws, and retractable tail depth probe move in lockstep.
- **3.2× Loupe Magnifier**: Inspection window clearly highlighting the exact coincident line with crosshairs.
- **Locking Screw**: Toggle mechanism lock to freeze readings.

### 2. Screw Gauge / Micrometer (Physics Core)
- **Cast Steel U-Frame & Carbide Faces**: Classic hammertone frame with $0 - 25\text{ mm}$, $0.01\text{ mm}$ specification.
- **Linear Pitch Scale**: Sleeve datum line with millimeter marks above and half-millimeter marks below.
- **3D Perspective Cylindrical Thimble**: 100 circular divisions procedurally projected using cylindrical curvature ($\text{LC} = 0.01\text{ mm}$).
- **Web Audio Ratchet Click Feedback**: Audible slip-knob ratchet feedback synthesized via Web Audio API.
- **3.6× Datum Loupe**: Focused inspection on sleeve datum line meeting the circular scale bevel.

### 3. Spherometer (Physics Practical)
- Equilateral tripod outer legs ($l = 45\text{ mm}$) with central screw and 100-division circular disc ($\text{LC} = 0.01\text{ mm}$).
- Measures sagitta $h$ and calculates radius of curvature of spherical surfaces:
  $$R = \frac{l^2}{6h} + \frac{h}{2}$$

### 4. Metre Bridge (Physics Practical)
- $100\text{ cm}$ constantan wire with wooden meter rule and heavy copper L/T terminal strips.
- Sliding jockey with analog galvanometer needle dynamically deflecting toward null balance ($I_g = 0$):
  $$X = R \frac{100 - l}{l}$$

### 5. Burette Titration Simulator (Chemistry Practical)
- $50\text{ mL}$ graduated burette with dropwise flow and fast stream stopcock controls.
- Lower meniscus inspection loupe.
- Conical flask with phenolphthalein indicator: transitions from colorless ($pH < 8.2$) to permanent faint pink at equivalence volume ($18.5\text{ mL}$).

### 6. Compound Microscope Simulator (Biology Practical)
- Coarse and fine focus adjustment dials with layered focal plane blur filter.
- $10\times$, $40\times$, and $100\times$ objectives.
- Cytology slide specimens: **Onion Epidermal Peel** (Safranin stain) and **Human Cheek Epithelial Cells** (Methylene blue stain).

---

## 🎯 Pedagogical & Practical Exam Features

- **Zero Error & Correction Suite**:
  - Nil Error ($0.00\text{ mm}$)
  - Positive Zero Error ($+0.20\text{ mm}$ / $+0.03\text{ mm}$): Instrument over-reads $\implies$ subtract error.
  - Negative Zero Error ($-0.30\text{ mm}$ / $-0.04\text{ mm}$): Instrument under-reads $\implies$ add correction.
  - Formula: $\text{Corrected Reading} = \text{Observed Reading} - (\text{Zero Error})$
- **Preset Specimen Clamping**: Ball bearing, hollow cylinder, glass slide, SWG 24 copper wire, lead shot, and aluminium block.
- **Observation Table**: Logs trials and calculates sample mean ($\bar{x}$) and standard deviation ($\sigma$) with one-click **CSV export**.
- **Viva Voce / Challenge Mode**: Hides live readings, generates practice questions, grades MSR/PSR, VSR/CSR, Total, and Corrected readings with progressive hints and `canvas-confetti` fireworks.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
- **Graphics**: Procedural HTML5 Canvas 2D API with high-DPI retina scaling
- **Sound**: Synthesized Web Audio API (zero external audio files)
- **Effects**: `canvas-confetti`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/nitin-das01/science-lab-simulator.git
cd science-lab-simulator

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` to explore the simulator.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
MIT License.
