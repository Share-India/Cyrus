# CYRUS - Complete Cyber Insurance Underwriting System
## Implementation Summary

### Overview
CYRUS is a production-ready deterministic cyber insurance underwriting engine that implements the Share India financial model with all 95 questions across 19 domains, industry-driven weights, killer logic with 3x multiplier, and fixed tier engine.

### Core Features Implemented

#### 1. All 95 Questions Across 19 Domains
- Network Security (10 questions)
- Data Backup and Recovery (9 questions) - includes killers: DBR-001, DBR-008
- Certifications (5 questions)
- Background Verification and Employee Awareness (8 questions)
- Regulatory Compliance (4 questions)
- Organizational Policies and Procedures (6 questions) - includes killer: PC-002
- Physical Perimeter Security (5 questions)
- Endpoint Security (6 questions)
- IoT and OT Network Security (5 questions)
- Asset Management (5 questions)
- Identity and Access Management (5 questions) - includes killer: IAM-001
- Vulnerability Assessment and Penetration Testing (4 questions)
- Ransomware Supplemental (5 questions) - includes killer: RS-005
- Dark Web Exposure (3 questions)
- Change/Patch Cadence (3 questions)
- DLP and DSPM (2 questions)
- Active Directory Configuration (2 questions)
- Incident Management and Response (3 questions) - includes killer: IR-001
- SOC and SOAR Capabilities (7 questions) - includes killer: SOC-001

#### 2. Killer Question Logic
- 7 default killer controls enabled: DBR-001, DBR-008, IAM-001, PC-002, RS-005, IR-001, SOC-001
- Killer questions carry 3x weight vs. 1x for standard questions
- Per-question killer toggle available in UI (togglable by underwriter)
- Auto-decline triggered when 2+ killer controls fail

#### 3. Industry-Driven Domain Weights
Five industry profiles implemented:
1. Manufacturing and Engineering
2. Healthcare
3. Retail and E-commerce
4. Financial Services
5. Technology and Software

Each profile has custom domain weights that total 100. Industry selection auto-applies weights.

#### 4. Manual Weight Override with Fail-Safe
- Toggle to enable manual domain weight adjustment
- Individual weight sliders for all 19 domains
- Real-time validation showing total weight
- Weights must total 100 for scoring to be valid
- Override persists when changing industries (with warning)

#### 5. Fixed Tier Engine (No D→A Skipping)
Deterministic tier assignment:
- Tier A: Score >= 90 (Base Rate)
- Tier B: Score >= 75 && < 90 (+20%)
- Tier C: Score >= 60 && < 75 (+50%)
- Tier D: Score < 60 or Auto-Decline (Decline)

#### 6. Scoring Mathematics
- Question Score: response × (isKiller ? 3 : 1)
- Domain Score: (Σ weighted responses / Σ max weights) × 100
- Overall Score: Σ(domainScore × activeWeight / 100)
- All decimals preserved; rounding on display only (2 decimal places)

#### 7. Auto-Decline Logic
- Triggered when failedKillers >= 2
- Overrides any positive score
- Forces Tier D assignment
- Displays all failed killer controls with explanations

#### 8. Explainability Layer
- Real-time domain contribution display
- Default vs. active weight comparison
- Failed killer list with questions and descriptions
- Generated decline narratives
- Domain-level performance breakdown

### UI Architecture

#### Three-Panel Layout
1. **Left Panel - Controls**
   - Industry selector
   - Manual weight override toggle
   - Weight adjustment sliders (when enabled)
   - All 19 domains with collapsible questions
   - Each question shows: ID, text, killer badge (if active), response control, killer toggle, weighted score

2. **Center Panel - Risk Engine**
   - Overall score display (0-100, animated)
   - Risk tier badge (A/B/C/D)
   - Premium loading display
   - Status indicator (ACTIVE/DECLINED)
   - Domain breakdown with score bars
   - Earned/max scores for each domain
   - Contribution to overall score

3. **Right Panel - Decision**
   - Decision badge (Accept/Accept-with-Loading/Decline)
   - Expandable decision factors
   - Failed killer controls list with full text
   - Explainability narrative
   - Deterministic engine attribution

### Technical Implementation

#### Scoring Engine (`lib/scoring-engine.ts`)
- `DOMAINS[]`: Full 95-question dataset
- `INDUSTRY_PROFILES[]`: 5 industry weight sets
- `calculateScore()`: Main scoring orchestrator
- `getQuestionWeight()`: 1 or 3 based on killer status
- `getDomainScore()`: Weighted domain calculation
- `getOverallScore()`: Sum of weighted domain contributions
- `checkAutoDecline()`: 2+ killer failure detection
- `getRiskTier()`: Deterministic tier assignment
- `getIndustryWeights()`: Industry profile application

#### Components
- `ControlsPanel`: Industry selection, override toggle, domain/question management
- `RiskEngine`: Score display, domain breakdown, tier visualization
- `DecisionPanel`: Decision badge, explainability, failed killers
- `QuestionRow`: Individual question UI (response control + killer toggle)

### Validation & Guardrails
- Domain weights must total 100 (when override enabled)
- All questions visible and answerable
- Killer toggles always editable
- Real-time recalculation on any change
- No rounding until display
- Tier transitions always sequential (no skipping)

### Key Differentiators
1. **Production-Ready**: All 95 questions correctly weighted per financial model
2. **Deterministic**: Every decision fully explainable, no black box logic
3. **Flexible**: Manual weight override with validation
4. **Auditable**: All inputs, weights, and calculations retained
5. **Industry-Smart**: 5 pre-configured industry profiles
6. **Killer-Strict**: 2+ threshold with 3x penalty ensures high-risk rejection

### Testing Scenarios

#### Scenario 1: Perfect Posture (All "Yes", No Killer Failures)
- Expected: Tier A, Base Rate, Score ~100

#### Scenario 2: Weak Controls (Mixed Responses, 1 Killer Fails)
- Expected: Lower score (B/C range), no auto-decline (only 1 killer failed)

#### Scenario 3: Critical Gaps (2+ Killer Failures)
- Expected: Immediate Tier D, Auto-Decline triggered

#### Scenario 4: Industry-Specific (Manufacturing vs. Healthcare)
- Manufacturing: IoT/OT weight = 10
- Healthcare: Regulatory Compliance weight = 8
- Same answers → Different scores based on industry weights

#### Scenario 5: Manual Override
- Default Manufacturing weights
- Toggle override
- Manually increase "Regulatory Compliance" weight to 15
- Verify weight total = 100
- Verify score recalculates with new weights

### Deployment Ready
- No external dependencies beyond existing shadcn/ui + Framer Motion
- Next.js 16 compatible
- Client-side only (no backend required)
- Real-time scoring
- Responsive three-panel design
- "Old money" enterprise aesthetic (slate/emerald)

### Future Enhancements (Optional)
- PDF export of complete assessment
- Historical comparison of scores
- Industry benchmark scoring
- Recommendations engine (domains to improve)
- Integration with backend for persistence
- Role-based access control (admin/underwriter/viewer)
